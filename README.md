# 🍔 Zomatify - Modern Food Delivery Platform

A comprehensive food delivery platform built with React, Node.js, and Supabase, featuring real-time order tracking, vendor management, and integrated Razorpay payments.

![Zomatify Banner](https://via.placeholder.com/800x200/667eea/ffffff?text=Zomatify+-+Food+Delivery+Platform)

## ✨ Features

### 🛍️ Customer Features
- **Browse Menu**: Explore categorized food items with rich details
- **Smart Cart**: Add items, customize quantities, and manage orders
- **Real-time Tracking**: Live order status updates and notifications
- **Multiple Payment Options**: Razorpay integration + Cash on Delivery
- **Order History**: View past orders and reorder favorites
- **Scheduled Orders**: Plan meals in advance
- **Group Orders**: Collaborate with friends on shared orders

### 🏪 Vendor Features
- **Unified Dashboard**: Manage pickup and delivery orders in one place
- **Real-time Notifications**: Instant alerts for new orders
- **Menu Management**: Add, edit, and organize menu items
- **Order Processing**: Accept, prepare, and complete orders seamlessly
- **Analytics Dashboard**: Revenue tracking and order insights
- **Payment Distribution**: Automated vendor payment processing
- **Inventory Control**: Track item availability and preparation times

### 🚀 Admin Features
- **System Analytics**: Comprehensive business intelligence
- **Vendor Management**: Onboard and manage restaurant partners
- **Queue Control**: Manage order flow and capacity
- **Payment Oversight**: Monitor transactions and refunds

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Styled Components** for styling
- **React Router** for navigation
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Date-fns** for date manipulation

### Backend
- **Node.js** with Express
- **Supabase** for database and real-time features
- **Razorpay** for payment processing
- **CORS** for cross-origin requests
- **UUID** for unique identifiers

### Database
- **PostgreSQL** via Supabase
- **Real-time subscriptions** for live updates
- **Row Level Security** for data protection
- **JSONB** for flexible order storage

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- Supabase account and project
- Razorpay account for payments

### 1. Clone the Repository
```bash
git clone https://github.com/Aryaman129/Zomatify.git
cd Zomatify
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Environment Setup

#### Frontend Environment (.env)
```bash
# Copy the example file
cp frontend/.env.example frontend/.env
```

Fill in your values:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=http://localhost:5001/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

#### Backend Environment (.env)
```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Fill in your values:
```env
PORT=5001
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Database Setup

Run the SQL setup script in your Supabase SQL editor:
```bash
# The setup script is in: supabase_setup.sql
```

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run frontend:dev  # Frontend on http://localhost:3000
npm run backend:dev   # Backend on http://localhost:5001
```

## 🌐 Deployment

### Frontend (Vercel)

1. **Connect Repository**: Link your GitHub repo to Vercel

2. **Environment Variables**: Add these to Vercel dashboard:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_API_BASE_URL` (your backend URL)
   - `REACT_APP_RAZORPAY_KEY_ID`

3. **Deploy**: Vercel will automatically build and deploy

### Backend (Render/Railway/Heroku)

1. **Create Service**: Choose web service on your platform

2. **Environment Variables**: Set production values:
   ```env
   NODE_ENV=production
   PORT=5001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_secret
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   ```

3. **Build Command**: `cd backend && npm install`
4. **Start Command**: `cd backend && npm start`

## 📱 API Documentation

### Authentication
- Uses Supabase Auth for user management
- JWT tokens for secure API access
- Role-based access control

### Core Endpoints

#### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Cancel order

#### Payments
- `POST /api/payments/order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `POST /api/payments/refund` - Process refunds

#### Vendor
- `GET /api/vendor/orders` - Get vendor orders
- `PATCH /api/vendor/orders/:id/status` - Update order status
- `POST /api/vendor/menu` - Manage menu items

## 🏗️ Project Structure

```
Zomatify/
├── frontend/                 # React application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── .env.example
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Server entry point
│   ├── package.json
│   └── .env.example
├── vercel.json             # Vercel deployment config
├── render.yaml             # Render deployment config
├── supabase_setup.sql      # Database schema
└── README.md
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL script from `supabase_setup.sql`
3. Enable Real-time for required tables
4. Configure Row Level Security policies

### Razorpay Setup
1. Create Razorpay account
2. Get API keys from dashboard
3. Configure webhooks for payment updates
4. Set up bank account for settlements

## 🧪 Testing

```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run all tests
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [https://zomatify.vercel.app](https://zomatify.vercel.app)
- **Backend API**: [https://zomatify-backend.render.com](https://zomatify-backend.render.com)
- **Documentation**: [GitHub Wiki](https://github.com/Aryaman129/Zomatify/wiki)

## 💫 Acknowledgments

- **Supabase** for the excellent backend-as-a-service
- **Razorpay** for seamless payment integration
- **Vercel** for frontend hosting and deployment
- **React** community for amazing ecosystem

## 📧 Support

For support, email: [your-email@domain.com](mailto:your-email@domain.com)

Or create an issue in the [GitHub repository](https://github.com/Aryaman129/Zomatify/issues).

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/Aryaman129">Aryaman129</a></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div> - Modern Food Ordering Platform

Zomatify is a next-generation food ordering platform designed specifically for local cafes, canteens, and restaurants. It focuses on efficient queue management, affordable operations, and enhanced customer experience.

## What Makes Zomatify Unique

### For Restaurant Owners
- **Interval-based order processing**: Process orders in batches to improve kitchen efficiency
- **Advanced queue management**: Control the flow of orders based on kitchen capacity
- **User-friendly menu management**: Easy-to-use interface for updating menu items
- **Detailed analytics dashboard**: Track sales, popular items, and customer preferences
- **Robust error handling**: Ensures consistent data across the application

### For Customers
- **Collaborative group ordering**: Order together with friends or colleagues
- **Smart queue position**: Real-time updates on order status and position
- **Scheduled recurring orders**: Set up regular orders for your favorite meals
- **Detailed preparation status**: Know exactly when your food will be ready

### Technical Advantages
- **Lightweight performance**: Optimized for speed and efficient resource usage
- **Enhanced data normalization**: Consistent data format between frontend and backend
- **Comprehensive error handling**: Graceful degradation and user-friendly error messages
- **Type-safe architecture**: Robust TypeScript implementation with strong typing
- **Open-source foundation**: Built on modern web technologies and open standards
- **Simplified backend**: Easy to deploy and maintain

### Business Model Differences
- **Lower commission structure**: More affordable for small businesses
- **Focus on local community**: Designed for campus canteens and local establishments
- **Direct customer-restaurant relationship**: No middleman interference

## Key Features

1. **Real-time Queue Management**
   - Control order flow based on kitchen capacity
   - Interval-based processing for improved efficiency
   - Smart notification system for pickup readiness

2. **Robust Order Management**
   - Comprehensive order tracking system
   - Multiple payment options (CoD, online payment)
   - Special instructions support

3. **Type-safe Architecture**
   - Strong TypeScript typing throughout the application
   - Data normalization utilities for consistent data format
   - Graceful error handling and fallbacks

4. **Advanced Analytics**
   - Sales trends and analysis
   - Popular item tracking
   - Peak hour identification

5. **Enhanced User Experience**
   - Intuitive UI for both customers and restaurant staff
   - Real-time order status updates
   - Customizable menu with categories and options

6. **Group & Scheduled Ordering**
   - Collaborative ordering for groups
   - Schedule recurring orders for regular meals
   - Split bill functionality

## Tech Stack

- **Frontend**: React, TypeScript, Styled Components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Hosting**: Vercel/Netlify
- **Payment**: RazorPay integration

## Project Status

Zomatify is currently in active development with core features being implemented. The platform is designed to be modular, allowing for easy expansion and customization based on specific business needs.

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Run development server with `npm run dev`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 