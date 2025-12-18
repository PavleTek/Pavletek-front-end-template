# Pavletek Frontend Template

Frontend template with React, Vite, and Tailwind CSS.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Run development:
```bash
npm run dev
```

---

## Mantenedores System

The template includes a powerful schema-driven system for managing reference data (categories, types, statuses, etc.) called "mantenedores".

### Features

- ✅ **Schema-driven UI** - Dropdowns and forms are generated from schemas
- ✅ **Nested creation** - Create parent items from within child forms
- ✅ **Global state** - All mantenedores cached in a central store
- ✅ **Version-based sync** - Automatic cache invalidation
- ✅ **No backend changes** - Add new types by editing one file

### Adding a New Mantenedor Type

Edit **one file**: `src/types/mantenedores.ts`

#### Step 1: Add to the Enum

```typescript
export const MantenedorType = {
  CONTAINER: 'CONTAINER',
  CONTAINER_TYPE: 'CONTAINER_TYPE',
  VESSEL: 'VESSEL',
  COST_TYPE: 'COST_TYPE',           // ← Add new type
  INVOICE_CONCEPT: 'INVOICE_CONCEPT', // ← Add new type
} as const;
```

#### Step 2: Add UI Schema

```typescript
export const uiSchemas: Record<MantenedorType, UISchema> = {
  // ... existing schemas ...

  [MantenedorType.COST_TYPE]: {
    title: 'Cost Type',
    description: 'Define a cost category',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },

  [MantenedorType.INVOICE_CONCEPT]: {
    title: 'Invoice Concept',
    description: 'Add a billing concept',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      // Dropdown that references another mantenedor type
      { 
        name: 'costTypeId', 
        label: 'Cost Type', 
        type: 'dropdown', 
        required: true, 
        sourceType: MantenedorType.COST_TYPE 
      },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
};
```

### Field Types

| Type | Description | Extra Props |
|------|-------------|-------------|
| `text` | Text input | `placeholder` |
| `number` | Number input | `placeholder` |
| `textarea` | Multi-line text | `placeholder` |
| `checkbox` | Boolean toggle | - |
| `dropdown` | Select from mantenedor | `sourceType` (required) |

### Using in Components

#### Dropdown

```tsx
import ReusableDropdown from './components/reusableDropdown';
import { MantenedorType } from './types/mantenedores';
import { useDrawer } from './contexts/DrawerContext';

function MyComponent() {
  const [selected, setSelected] = useState(null);
  const { openDrawer } = useDrawer();

  const handleCreateNew = (type: MantenedorType) => {
    openDrawer(`mantenedor-${type}`, { type });
  };

  return (
    <ReusableDropdown
      type={MantenedorType.COST_TYPE}
      label="Cost Type"
      value={selected}
      onChange={setSelected}
      onCreateNew={handleCreateNew}
    />
  );
}
```

#### Accessing Data Directly

```tsx
import { useMantenedores } from './contexts/MantenedoresContext';
import { MantenedorType } from './types/mantenedores';

function MyComponent() {
  const { getItemsByType, getItemById } = useMantenedores();

  // Get all items of a type
  const costTypes = getItemsByType(MantenedorType.COST_TYPE);

  // Get specific item by ID
  const costType = getItemById(MantenedorType.COST_TYPE, 5);

  return (
    <ul>
      {costTypes.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

---

## Railway Deployment

1. Start your frontend repo with this as a template
2. Start a service in Railway with your repo as the source
3. Deploy on Railway
4. After deployment, deploy a public URL to access the webpage
5. Set the `.env` value `VITE_ALLOWED_HOSTS` as the public URL of the webpage
6. After deploying the backend, set the `VITE_API_BASE_URL` as the backend URL (add `https://` at the start and `/api` at the end)
