Frontend Structure--

src/
├── assets/          # Static files (images, svgs, fonts)
├── components/      # Shared/Global UI components (Buttons, Inputs, Modals)
├── features/        # The "Meat" - organized by domain (auth, products, cart)
├── hooks/           # Global reusable custom hooks
├── layouts/         # Page wrappers (AdminLayout, PublicLayout)
├── lib/             # Third-party configurations (axios, firebase, supabase)
├── pages/           # Route views (only imports features/components)
├── services/        # Global API calls/Business logic
├── store/           # Global state management (Zustand, Redux, or Context)
├── utils/           # Helper functions (formatting dates, currency)
└── types/           # Global TypeScript interfaces/types
