"""
Scheduler service for automatic fixed expenses application
"""

from typing import List, Dict, Any, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import os
from database.neon_client import get_neon
from services.fixed_expense_service import FixedExpenseService

logger = logging.getLogger(__name__)

class SchedulerService:
    """Service for scheduling background jobs"""
    
    def __init__(self):
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.fixed_expense_service = FixedExpenseService()
        self.neon = get_neon()
        self.enabled = os.getenv("AUTO_APPLY_FIXED_EXPENSES", "true").lower() == "true"
        self.schedule_hour = int(os.getenv("FIXED_EXPENSES_SCHEDULE_HOUR", "2"))
        self.schedule_minute = int(os.getenv("FIXED_EXPENSES_SCHEDULE_MINUTE", "0"))
    
    async def start(self):
        """Start the scheduler"""
        if not self.enabled:
            logger.info("Auto-apply fixed expenses is disabled via AUTO_APPLY_FIXED_EXPENSES env var")
            return
        
        if self.scheduler is not None:
            logger.warning("Scheduler already started")
            return
        
        try:
            self.scheduler = AsyncIOScheduler()
            
            # Add daily job to check and apply fixed expenses
            self.scheduler.add_job(
                self.daily_fixed_expenses_job,
                trigger=CronTrigger(hour=self.schedule_hour, minute=self.schedule_minute),
                id="daily_fixed_expenses",
                name="Apply fixed expenses daily check",
                replace_existing=True
            )
            
            self.scheduler.start()
            logger.info(f"Scheduler started. Daily job scheduled for {self.schedule_hour:02d}:{self.schedule_minute:02d} UTC")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
            raise
    
    async def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler is not None:
            try:
                self.scheduler.shutdown(wait=True)
                logger.info("Scheduler shut down successfully")
            except Exception as e:
                logger.error(f"Error shutting down scheduler: {e}")
            finally:
                self.scheduler = None
    
    async def get_all_users_with_fixed_expenses(self) -> List[str]:
        """Get list of all user IDs who have active fixed expenses"""
        try:
            # Get distinct user IDs who have active fixed expenses from fixed_expenses table
            query = """
                SELECT DISTINCT user_id
                FROM fixed_expenses
                WHERE is_active = true
            """
            
            results = await self.neon.fetch(query)
            user_ids = [str(row["user_id"]) for row in results]
            
            logger.info(f"Found {len(user_ids)} users with active fixed expenses")
            return user_ids
        except Exception as e:
            logger.error(f"Error getting users with fixed expenses: {e}")
            return []
    
    async def apply_fixed_expenses_for_all_users(self, year: int, month: int) -> Dict[str, Any]:
        """Apply fixed expenses for all users for given month/year"""
        user_ids = await self.get_all_users_with_fixed_expenses()
        
        if not user_ids:
            logger.info(f"No users with fixed expenses found for {year}-{month:02d}")
            return {
                "total_users": 0,
                "total_applied": 0,
                "errors": []
            }
        
        total_applied = 0
        errors = []
        
        logger.info(f"Applying fixed expenses for {len(user_ids)} users for {year}-{month:02d}")
        
        for user_id in user_ids:
            try:
                count = await self.fixed_expense_service.apply_fixed_expenses_for_month(
                    user_id, year, month
                )
                if count > 0:
                    total_applied += count
                    logger.info(f"Applied {count} fixed expense(s) for user {user_id} in {year}-{month:02d}")
            except Exception as e:
                error_msg = f"Error applying fixed expenses for user {user_id}: {str(e)}"
                logger.error(error_msg)
                errors.append({
                    "user_id": user_id,
                    "error": str(e)
                })
        
        result = {
            "total_users": len(user_ids),
            "total_applied": total_applied,
            "errors": errors
        }
        
        logger.info(
            f"Fixed expenses application completed for {year}-{month:02d}: "
            f"{total_applied} expenses applied for {len(user_ids)} users, "
            f"{len(errors)} errors"
        )
        
        return result
    
    async def apply_current_month_if_needed(self):
        """Apply fixed expenses for current month on startup if not already applied"""
        if not self.enabled:
            return
        
        try:
            now = datetime.now()
            year = now.year
            month = now.month
            
            logger.info(f"Checking if fixed expenses need to be applied for {year}-{month:02d}")
            
            result = await self.apply_fixed_expenses_for_all_users(year, month)
            
            if result["total_applied"] > 0:
                logger.info(
                    f"Startup: Applied {result['total_applied']} fixed expense(s) "
                    f"for {result['total_users']} users"
                )
            else:
                logger.info(
                    f"Startup: No fixed expenses to apply for {year}-{month:02d} "
                    f"(already applied or no active fixed expenses)"
                )
        except Exception as e:
            logger.error(f"Error applying fixed expenses on startup: {e}")
    
    async def daily_fixed_expenses_job(self):
        """Daily job to apply fixed expenses if new month"""
        if not self.enabled:
            return
        
        try:
            now = datetime.now()
            year = now.year
            month = now.month
            
            # Check if we're in the first few days of the month (1-3) to handle timezone issues
            # This ensures we catch month transitions even if the job runs slightly late
            if now.day <= 3:
                logger.info(f"Daily job: Checking fixed expenses for {year}-{month:02d} (day {now.day})")
                result = await self.apply_fixed_expenses_for_all_users(year, month)
                
                if result["total_applied"] > 0:
                    logger.info(
                        f"Daily job: Applied {result['total_applied']} fixed expense(s) "
                        f"for {result['total_users']} users"
                    )
                else:
                    logger.info(
                        f"Daily job: No fixed expenses to apply for {year}-{month:02d} "
                        f"(already applied or no active fixed expenses)"
                    )
            else:
                logger.debug(f"Daily job: Skipping (day {now.day} is not in first 3 days of month)")
        except Exception as e:
            logger.error(f"Error in daily fixed expenses job: {e}")


# Global instance
scheduler_service = SchedulerService()

