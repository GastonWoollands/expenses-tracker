/**
 * Register page component
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { Button, Input, FormField, Card, Alert, Container, Heading } from '../components';
import { apiService } from '../services/api';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // First, create Firebase account
      await signUp(email, password);
      
      // Then, update user profile with name, surname, and phone_number (if provided)
      const profileUpdate: {
        name?: string;
        surname?: string;
        phone_number?: string;
      } = {};
      
      if (name.trim()) {
        profileUpdate.name = name.trim();
      }
      if (surname.trim()) {
        profileUpdate.surname = surname.trim();
      }
      if (phoneNumber.trim()) {
        profileUpdate.phone_number = phoneNumber.trim();
      }
      
      // Only update profile if at least one field is provided
      if (Object.keys(profileUpdate).length > 0) {
        await apiService.updateUserProfile(profileUpdate);
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-200 py-16">
      <Container width="sm">
        <Card>
          <div className="space-y-3 text-center">
            <Heading level={2}>Create your account</Heading>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Or{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <FormField label="Email address" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
              />
            </FormField>

            <FormField label="Name (optional)" htmlFor="name">
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="given-name"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
              />
            </FormField>

            <FormField label="Surname (optional)" htmlFor="surname">
              <Input
                id="surname"
                name="surname"
                type="text"
                autoComplete="family-name"
                placeholder="Last name"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                leftIcon={<User className="h-5 w-5 text-gray-400" />}
              />
            </FormField>

            <FormField label="Phone number (optional)" htmlFor="phoneNumber">
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                leftIcon={<Phone className="h-5 w-5 text-gray-400" />}
              />
            </FormField>

            <FormField label="Password" htmlFor="password">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                rightAdornment={
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </FormField>

            <FormField label="Confirm password" htmlFor="confirmPassword">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                rightAdornment={
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
              />
            </FormField>

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" className="w-full" isLoading={loading}>
              Create account
            </Button>
          </form>
        </Card>
      </Container>
    </div>
  );
};

export default Register;
