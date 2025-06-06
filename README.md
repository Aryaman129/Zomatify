# Zomatify - Food Ordering Platform

Zomatify is a full-stack food ordering and delivery platform inspired by Zomato. It enables customers to browse menus, place orders, and track deliveries while providing restaurant owners with tools to manage their menu, orders, and queue settings.

![Zomatify Banner](https://via.placeholder.com/800x400?text=Zomatify+Food+Ordering+Platform)

## Features

### Customer Features
- **User Authentication**: Sign up, log in, and manage profile information
- **Menu Browsing**: Browse restaurant menus with filtering options
- **Cart Management**: Add items to cart, modify quantities, and checkout
- **Order Placement**: Place orders with delivery address and payment options
- **Order Tracking**: Track order status from preparation to delivery
- **Scheduled Orders**: Schedule orders for future dates and times
- **Group Orders**: Create group orders for multiple people to add items
- **Notifications**: Receive real-time updates on order status

### Restaurant Owner Features
- **Dashboard**: Overview of business metrics and current orders
- **Menu Management**: Add, edit, and delete menu items with drag-and-drop image upload
- **Order Management**: View and update order status with real-time notifications
- **Queue Management**: Control order flow with customizable queue settings
- **Analytics**: View sales data, popular items, and other business metrics
- **Interval-based Order Processing**: Process orders in batches at configurable intervals

## What Makes Zomatify Unique

While inspired by Zomato, Zomatify introduces several innovative features that set it apart:

### For Restaurant Owners
- **Interval-Based Order Processing**: Unlike Zomato's continuous order flow, Zomatify allows restaurants to process orders in timed intervals (e.g., every 10 minutes), helping kitchen staff manage workload more efficiently
- **Advanced Queue Management System**: Restaurants can set maximum active order limits, cooling periods, and interval timing to prevent overwhelming the kitchen during peak hours
- **User-Friendly Menu Management**: Simple drag-and-drop image uploading system that doesn't require external image hosting, making it easier for less tech-savvy restaurant owners
- **Comprehensive Analytics Dashboard**: More detailed insights into sales patterns, popular items, and operational efficiency specifically tailored for small to medium-sized restaurants

### For Customers
- **Collaborative Group Ordering**: More advanced than Zomato's basic group ordering, allowing real-time collaboration, individual payment options, and synchronized delivery
- **Smart Queue Position**: Transparent queue system that shows customers their position in line and estimated preparation time, reducing anxiety about wait times
- **Scheduled Orders with Recurring Options**: Set up regular meal deliveries (daily, weekly) for convenience, a feature not available in most food delivery apps
- **Real-Time Kitchen Updates**: More granular status updates showing exactly where your order is in the preparation process (e.g., "preparing", "in the oven", "packaging")

### Technical Advantages
- **Lightweight and Fast**: Built with performance in mind, Zomatify loads significantly faster than heavier commercial apps
- **Privacy-Focused**: Less intrusive data collection compared to major delivery platforms
- **Open-Source Foundation**: Built on accessible technologies that can be extended and customized by the community
- **Simplified Backend**: Uses Supabase to dramatically reduce backend complexity while maintaining powerful features

### Business Model Differences
- **Lower Commission Structure**: Designed with smaller commission fees to help local restaurants retain more profit
- **Direct Customer-Restaurant Relationship**: Encourages direct communication between restaurants and customers, building loyalty
- **Focus on Local Communities**: Emphasis on neighborhood restaurants rather than large chains

## Tech Stack

### Frontend
- **React.js**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript
- **Styled Components**: CSS-in-JS styling solution
- **React Router**: For navigation and routing
- **Zustand**: State management
- **Axios**: HTTP client for API calls
- **React Toastify**: Toast notifications
- **Date-fns**: Date manipulation library
- **React Icons**: Icon library
- **Framer Motion**: Animations

### Backend
- **Supabase**: Backend-as-a-Service for:
  - **Authentication**: User signup, login, and session management
  - **Database**: PostgreSQL database for storing application data
  - **Storage**: File storage for menu item images
  - **Real-time Subscriptions**: For live updates of orders and notifications

### Database
- **PostgreSQL**: Relational database with the following tables:
  - `profiles`: User profile information
  - `menu_items`: Restaurant menu items
  - `orders`: Customer orders
  - `scheduled_orders`: Orders scheduled for future dates
  - `group_orders`: Collaborative group orders
  - `notifications`: User notifications
  - `queue_settings`: Restaurant order queue configuration
  - `shop_analytics`: Restaurant business metrics

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/Aryaman129/Zomatify.git
   cd Zomatify
   ```

2. Install dependencies for the frontend:
   ```
   cd frontend
   npm install
   ```

3. Create a `.env` file in the frontend directory with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Supabase database:
   - Create a new Supabase project
   - Run the SQL scripts in `supabase_setup.sql` to create tables and set up RLS policies

5. Start the development server:
   ```
   npm start
   ```

## Application Architecture

The application follows a client-server architecture with:

1. **Frontend React Application**: Handles UI, state management, and API calls
2. **Supabase Backend**: Manages authentication, database, and real-time subscriptions
3. **PostgreSQL Database**: Stores application data with row-level security policies

### Key Components

- **Authentication Context**: Manages user authentication state
- **API Services**: Handle communication with Supabase
- **Order Management**: Processes and tracks customer orders
- **Queue System**: Manages restaurant order flow
- **Real-time Updates**: Provides live updates on order status and notifications

## Development Notes

- The application uses TypeScript for type safety
- Styled Components are used for component styling
- Row Level Security (RLS) policies are implemented for data security
- Real-time subscriptions are used for live updates

## Screenshots

*(Replace with actual screenshots of your application)*

| Home Screen | Menu | Cart | Order Tracking |
|-------------|------|------|---------------|
| ![Home](https://via.placeholder.com/200x400?text=Home) | ![Menu](https://via.placeholder.com/200x400?text=Menu) | ![Cart](https://via.placeholder.com/200x400?text=Cart) | ![Tracking](https://via.placeholder.com/200x400?text=Tracking) |

| Shopkeeper Dashboard | Menu Management | Order Management | Analytics |
|----------------------|-----------------|------------------|-----------|
| ![Dashboard](https://via.placeholder.com/200x400?text=Dashboard) | ![Menu Management](https://via.placeholder.com/200x400?text=Menu+Management) | ![Order Management](https://via.placeholder.com/200x400?text=Order+Management) | ![Analytics](https://via.placeholder.com/200x400?text=Analytics) |

## Future Enhancements

- Mobile app using React Native
- Delivery partner interface
- Enhanced analytics and reporting
- Integration with payment gateways
- Loyalty program and rewards system
- Machine learning for order recommendations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by food delivery platforms like Zomato
- Special thanks to the creators of the libraries and tools used in this project 