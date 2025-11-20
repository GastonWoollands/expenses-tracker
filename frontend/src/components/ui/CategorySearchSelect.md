# CategorySearchSelect Component

A searchable dropdown component for selecting expense categories in the Expenses form.

## Features

- **Search Functionality**: Type to filter through 65+ categories
- **Keyboard Navigation**: Use arrow keys, Enter, and Escape
- **Clear Selection**: X button to clear current selection
- **Accessibility**: Full ARIA support and keyboard navigation
- **Responsive**: Works on all screen sizes
- **Dark Mode**: Supports light and dark themes

## Usage

```tsx
import { CategorySearchSelect } from '../components';

<CategorySearchSelect
  value={selectedCategory}
  onChange={(categoryKey) => setSelectedCategory(categoryKey)}
  placeholder="Select category"
  required
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Selected category key |
| `onChange` | `(value: string) => void` | - | Callback when selection changes |
| `placeholder` | `string` | `'Select category'` | Placeholder text |
| `className` | `string` | `''` | Additional CSS classes |
| `required` | `boolean` | `false` | Whether field is required |

## Search Features

- **Multi-field Search**: Searches category name, description, and key
- **Case Insensitive**: Works with any case
- **Real-time Filtering**: Results update as you type
- **Results Counter**: Shows "X of 65 categories" when searching
- **Empty State**: Helpful message when no results found

## Keyboard Shortcuts

- **Enter/Space/Arrow Down**: Open dropdown
- **Arrow Up/Down**: Navigate through options
- **Enter**: Select highlighted option
- **Escape**: Close dropdown
- **Type**: Start searching

## Examples

### Basic Usage
```tsx
const [category, setCategory] = useState('');

<CategorySearchSelect
  value={category}
  onChange={setCategory}
  placeholder="Choose a category"
/>
```

### With Validation
```tsx
<CategorySearchSelect
  value={form.category}
  onChange={(value) => updateField('category', value)}
  placeholder="Select category"
  required
  className="pl-10"
/>
```

## Styling

The component uses Tailwind CSS classes and supports:
- Custom className prop
- Required field styling (red border)
- Focus states
- Hover states
- Dark mode variants

## Accessibility

- Full ARIA support
- Keyboard navigation
- Screen reader friendly
- Focus management
- Proper labeling
