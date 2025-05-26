# Expense Tracker Backend API

A robust Node.js/Express REST API for expense tracking with MongoDB, JWT authentication, AWS integration, and Google Cloud services.

## 🚀 Features

- **User Authentication** - JWT-based secure authentication
- **Expense Management** - CRUD operations for expenses
- **Budget Tracking** - Budget creation and monitoring
- **File Upload** - Profile picture and receipt uploads
- **AWS Integration** - S3 storage, Lambda functions, Cost Explorer
- **Google Cloud AI** - Speech-to-text and AI Platform integration
- **Report Generation** - Automated expense reports
- **RESTful API** - Clean, documented API endpoints
- **Data Validation** - Comprehensive input validation
- **Error Handling** - Structured error responses

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.14.1
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.2
- **File Upload**: Multer 1.4.5
- **Cloud Services**: 
  - AWS SDK v3 (S3, Lambda, Cost Explorer, Budgets)
  - Google Cloud (AI Platform, Speech-to-Text)
- **Media Processing**: FFmpeg (fluent-ffmpeg 2.1.3)
- **Date Handling**: Moment.js 2.30.1, date-fns 4.1.0
- **Environment**: dotenv 16.5.0
- **CORS**: cors 2.8.5

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- AWS Account (for cloud features)
- Google Cloud Account (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-backend-repo-url>
   cd expense-tracker-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   # or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   
   # Google Cloud Credentials (JSON format)
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
   
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_ACCOUNT_ID=your-aws-account-id
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   AWS_LAMBDA_REPORT_FUNCTION=your-lambda-function-name
   AWS_LAMBDA_LIST_REPORTS_FUNCTION=your-list-reports-function
   AWS_BUDGET_NOTIFICATION_EMAIL=your-email@example.com
   ```

4. **Start the development server**
   ```bash
   # Development with nodemon
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify the server**
   Navigate to `http://localhost:5000` - you should see "API running..."

## 🌐 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

## 📁 Project Structure

```
expense-tracker-backend/
├── config/
│   └── db.js                   # MongoDB connection
├── middleware/
│   ├── auth.js                 # JWT authentication middleware
│   └── upload.js               # File upload middleware
├── models/
│   ├── User.js                 # User schema
│   ├── Expense.js              # Expense schema
│   ├── Budget.js               # Budget schema
│   └── Report.js               # Report schema
├── routes/
│   ├── auth.js                 # Authentication routes
│   ├── transactions.js         # Expense/transaction routes
│   ├── budgets.js              # Budget management routes
│   ├── profile.js              # User profile routes
│   └── reports.js              # Report generation routes
├── uploads/                    # File upload directory
├── utils/
│   ├── validators.js           # Input validation
│   ├── helpers.js              # Utility functions
│   └── errorHandler.js         # Error handling
├── services/
│   ├── awsService.js           # AWS integrations
│   ├── googleService.js        # Google Cloud services
│   └── reportService.js        # Report generation
├── .env                        # Environment variables
├── .gitignore
├── server.js                   # Main server file
└── package.json
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register       # User registration
POST   /api/auth/login          # User login
GET    /api/auth/me             # Get current user
PUT    /api/auth/profile        # Update user profile
```

### Expenses/Transactions
```
GET    /api/transactions        # Get all expenses
POST   /api/transactions        # Create new expense
GET    /api/transactions/:id    # Get specific expense
PUT    /api/transactions/:id    # Update expense
DELETE /api/transactions/:id    # Delete expense
```

### Budgets
```
GET    /api/budgets             # Get all budgets
POST   /api/budgets             # Create new budget
GET    /api/budgets/:id         # Get specific budget
PUT    /api/budgets/:id         # Update budget
DELETE /api/budgets/:id         # Delete budget
```

### Profile
```
GET    /api/profile             # Get user profile
PUT    /api/profile             # Update profile
POST   /api/profile/avatar      # Upload profile picture
```

### Reports
```
GET    /api/reports             # Get all reports
POST   /api/reports/generate    # Generate new report
GET    /api/reports/:id         # Get specific report
DELETE /api/reports/:id         # Delete report
```

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login** to receive a JWT token
2. **Include token** in Authorization header: `Bearer <token>`
3. **Protected routes** require valid JWT token

### Example Usage
```javascript
// Login request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token } = await response.json();

// Authenticated request
const expenses = await fetch('/api/transactions', {
  headers: { 'Authorization': `Bearer \${token}` }
});
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Expense Model
```javascript
{
  user: ObjectId (ref: User),
  amount: Number,
  category: String,
  description: String,
  date: Date,
  receipt: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Budget Model
```javascript
{
  user: ObjectId (ref: User),
  category: String,
  amount: Number,
  period: String (monthly/yearly),
  startDate: Date,
  endDate: Date,
  spent: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## ☁️ Cloud Integrations

### AWS Services
- **S3**: File storage for receipts and profile pictures
- **Lambda**: Serverless report generation
- **Cost Explorer**: AWS cost analysis
- **Budgets**: Budget monitoring and alerts

### Google Cloud Services
- **AI Platform**: Expense categorization and insights
- **Speech-to-Text**: Voice input for expenses

## 🚀 Deployment

### Deploy to Render

1. **Create a new Web Service** on Render
2. **Connect your repository**
3. **Configure build settings**:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Root Directory: `expense_tracker_backend` (if in subfolder)
4. **Set environment variables** (all variables from .env)
5. **Deploy**

### Deploy to Railway

1. **Connect your repository** to Railway
2. **Set environment variables**
3. **Deploy** automatically

### Deploy to Heroku

1. **Create a new app** on Heroku
2. **Set environment variables** in Heroku dashboard
3. **Deploy** using Git or GitHub integration

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud service account JSON | Yes |
| `AWS_REGION` | AWS region | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `AWS_ACCOUNT_ID` | AWS account ID | Yes |
| `AWS_S3_BUCKET_NAME` | S3 bucket for file storage | Yes |
| `AWS_LAMBDA_REPORT_FUNCTION` | Lambda function name | No |
| `AWS_BUDGET_NOTIFICATION_EMAIL` | Email for budget alerts | No |

### CORS Configuration

Update CORS settings in `server.js` for production:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',  // Local development
    'https://your-frontend-domain.vercel.app'  // Production frontend
  ]
}));
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test API endpoints manually
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer your-jwt-token"
```

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **JWT Authentication** - Stateless authentication
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Configured for specific origins
- **Environment Variables** - Sensitive data protection
- **Error Handling** - No sensitive data in error responses

## 📊 Monitoring & Logging

- **Request Logging** - All API requests logged
- **Error Tracking** - Structured error logging
- **Performance Monitoring** - Response time tracking
- **Health Checks** - API health endpoints

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check `MONGO_URI` format
   - Verify MongoDB is running
   - Check network connectivity

2. **JWT Authentication Fails**
   - Verify `JWT_SECRET` is set
   - Check token format in requests
   - Ensure token hasn't expired

3. **File Upload Issues**
   - Check `uploads/` directory exists
   - Verify file permissions
   - Check multer configuration

4. **AWS/Google Cloud Errors**
   - Verify credentials are correct
   - Check service permissions
   - Validate JSON format for Google credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow RESTful API conventions
- Write comprehensive tests
- Document new endpoints
- Use meaningful commit messages
- Update environment variable documentation

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔗 Related

- [Frontend Repository](link-to-frontend-repo)
- [Live API](your-deployed-api-url)
- [API Documentation](link-to-api-docs)

## 🙏 Acknowledgments

- Express.js team for the robust framework
- MongoDB team for the excellent database
- AWS and Google Cloud for cloud services
- All open-source contributors
```

## Frontend README

```md project="Frontend README" file="README.md" type="markdown"
# Expense Tracker Frontend

A modern, responsive React application for personal expense tracking with real-time charts, budget management, and intuitive user interface.

## 🚀 Features

- **Dashboard** - Overview of expenses, budgets, and financial health
- **Expense Tracking** - Add, edit, and categorize expenses
- **Budget Management** - Set spending limits and track progress
- **Visual Analytics** - Interactive charts and graphs using Chart.js
- **Profile Management** - User profile with avatar upload
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Live data synchronization
- **Voice Input** - Speech-to-text expense entry
- **Export Data** - Download reports and analytics

## 🛠️ Tech Stack

- **Framework**: React 19.1.0
- **Routing**: React Router DOM 7.5.3
- **HTTP Client**: Axios 1.9.0
- **Charts**: Chart.js 4.4.9 with React Chart.js 2
- **Icons**: React Icons, Lucide React, FontAwesome
- **Animations**: Lottie React 2.4.1
- **Notifications**: React Toastify, SweetAlert2
- **Styling**: CSS3 with responsive design
- **Date Handling**: date-fns 4.1.0
- **Testing**: React Testing Library

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Backend API running (see [Backend Repository](link-to-backend-repo))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-frontend-repo-url>
   cd expense-tracker-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Development
   REACT_APP_API_URL=http://localhost:5000/api
   
   # Production
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🌐 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## 📱 Features Overview

### 🏠 Dashboard
- Financial overview with key metrics
- Recent transactions display
- Budget progress indicators
- Interactive charts showing spending trends
- Quick action buttons for common tasks

### 💰 Expense Management
- Add new expenses with categories
- Edit and delete existing expenses
- Search and filter functionality
- Bulk operations support
- Voice input for quick entry
- Receipt photo upload

### 📊 Budget Tracking
- Create monthly/yearly budgets
- Real-time spending tracking
- Budget alerts and notifications
- Visual progress indicators
- Category-wise budget breakdown

### 👤 Profile Management
- User profile customization
- Avatar upload functionality
- Account settings management
- Security preferences
- Data export options

### 📈 Analytics
- Spending trends over time
- Category-wise expense breakdown
- Monthly/yearly comparisons
- Interactive charts and graphs
- Export functionality (PDF, CSV)

## 📁 Project Structure

```
expense-tracker-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.js
│   │   │   ├── DashboardCard.js
│   │   │   └── RecentTransactions.js
│   │   ├── Expenses/
│   │   │   ├── ExpenseList.js
│   │   │   ├── ExpenseForm.js
│   │   │   └── ExpenseItem.js
│   │   ├── Budgets/
│   │   │   ├── BudgetList.js
│   │   │   ├── BudgetForm.js
│   │   │   └── BudgetProgress.js
│   │   ├── Profile/
│   │   │   ├── Profile.js
│   │   │   ├── ProfileForm.js
│   │   │   └── AvatarUpload.js
│   │   ├── Charts/
│   │   │   ├── ExpenseChart.js
│   │   │   ├── BudgetChart.js
│   │   │   └── TrendChart.js
│   │   └── common/
│   │       ├── Header.js
│   │       ├── Sidebar.js
│   │       ├── Loading.js
│   │       └── ErrorBoundary.js
│   ├── services/
│   │   └── api.js              # Axios configuration
│   ├── utils/
│   │   ├── helpers.js          # Utility functions
│   │   ├── formatters.js       # Data formatting
│   │   └── validators.js       # Input validation
│   ├── hooks/
│   │   ├── useAuth.js          # Authentication hook
│   │   ├── useExpenses.js      # Expenses management
│   │   └── useBudgets.js       # Budget management
│   ├── context/
│   │   └── AuthContext.js      # Authentication context
│   ├── styles/
│   │   ├── global.css          # Global styles
│   │   ├── components.css      # Component styles
│   │   └── responsive.css      # Responsive design
│   ├── App.js                  # Main App component
│   ├── App.css                 # App styles
│   └── index.js                # Entry point
├── .env.local                  # Environment variables
├── .gitignore
└── package.json
```

## 🔌 API Integration

The frontend communicates with the backend API through Axios:

```javascript
// services/api.js
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer \${token}`;
  }
  return config;
});

export default instance;
```

### API Endpoints Used

- `POST /auth/login` - User authentication
- `GET /transactions` - Fetch expenses
- `POST /transactions` - Create new expense
- `GET /budgets` - Fetch budgets
- `POST /budgets` - Create new budget
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository** to Vercel
2. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
3. **Set environment variables**:
   - `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`
4. **Deploy** automatically on push to main branch

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Configure build settings**:
   - Build Command: `npm run build`
   - Publish Directory: `build`
3. **Set environment variables** in Netlify dashboard
4. **Deploy**

### Deploy to Render

1. **Create a new Static Site** on Render
2. **Configure build settings**:
   - Build Command: `npm install; npm run build`
   - Publish Directory: `build`
3. **Set environment variables**
4. **Deploy**

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API base URL | Yes |

### API Configuration

Update the API base URL in `src/services/api.js` based on your environment:

```javascript
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
```

### Image URLs

For production, update hardcoded image URLs:

```javascript
// Replace localhost URLs with your backend URL
const imageUrl = `https://your-backend-url.onrender.com\${imagePath}`;
```

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach
- **Modern Interface** - Clean, intuitive design
- **Smooth Animations** - Lottie animations for better UX
- **Interactive Charts** - Real-time data visualization
- **Toast Notifications** - User feedback system
- **Loading States** - Skeleton screens and spinners
- **Error Handling** - Graceful error messages
- **Accessibility** - WCAG compliant components

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
```
src/
├── __tests__/
│   ├── components/
│   ├── services/
│   └── utils/
└── setupTests.js
```

## 🔒 Security

- **JWT Token Management** - Secure token storage and handling
- **Input Validation** - Client-side validation for all forms
- **XSS Protection** - Sanitized user inputs
- **HTTPS Communication** - Secure API communication
- **Error Handling** - No sensitive data in error messages

## 📱 Browser Support

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🎯 Performance

- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Compressed and responsive images
- **Bundle Analysis** - Optimized bundle size
- **Caching** - Efficient API response caching
- **Minification** - Production build optimization

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check `REACT_APP_API_URL` is correct
   - Verify backend is running
   - Check CORS configuration in backend

2. **Authentication Issues**
   - Clear localStorage and login again
   - Check JWT token expiration
   - Verify API endpoints

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check for dependency conflicts
   - Verify Node.js version

4. **Chart Display Issues**
   - Check Chart.js version compatibility
   - Verify data format for charts
   - Check console for errors

5. **Image Loading Issues**
   - Verify backend URL is correct
   - Check image paths
   - Ensure backend serves static files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices
- Write tests for new components
- Use meaningful commit messages
- Update documentation for new features
- Ensure responsive design

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔗 Related

- [Backend Repository](link-to-backend-repo)
- [Live Demo](your-deployed-app-url)
- [API Documentation](link-to-api-docs)

## 🙏 Acknowledgments

- React team for the amazing framework
- Chart.js for beautiful charts
- Lottie for smooth animations
- Axios for HTTP client
- All open-source contributors
```

These separate README files provide comprehensive documentation for each repository with:

- **Technology-specific details** for each stack
- **Separate installation instructions**
- **Individual deployment guides**
- **Project-specific configurations**
- **Cross-references** between repositories
- **Relevant troubleshooting sections**

You can customize the URLs, email addresses, and specific details to match your actual repositories and deployment URLs.

