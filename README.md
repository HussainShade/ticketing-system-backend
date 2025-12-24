# Ticketing System Backend

A RESTful API backend for a ticketing and support management system built with Node.js and Express. This system enables customers to raise support tickets, administrators to manage tickets and assign technicians, and technicians to resolve tickets with automated email notifications.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (via `pg` driver)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **Logging**: Morgan
- **Environment**: dotenv

## Architecture

### Project Structure

```
├── config/
│   └── db.js              # PostgreSQL connection pool
├── controllers/
│   ├── authController.js  # Authentication & registration
│   ├── customerController.js
│   ├── technicianController.js
│   └── ticketController.js
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   └── roleMiddleware.js  # Role-based access control
├── routes/
│   ├── authRoutes.js
│   ├── customerRoutes.js
│   ├── technicianRoutes.js
│   └── ticketRoutes.js
├── utils/
│   ├── idGenerator.js     # Sequential ID generation (TKT, CUS, TEC)
│   └── mailer.js          # Email notification templates
├── server.js              # Express app & server setup
└── package.json
```

### Request Flow

1. **Request** → Express middleware (CORS, JSON parsing, logging)
2. **Route** → Matches endpoint in route files
3. **Middleware** → `authMiddleware` verifies JWT token
4. **Middleware** → `roleMiddleware` checks user role permissions
5. **Controller** → Business logic, database queries
6. **Response** → JSON response or error handling

### Database Schema

The system uses the following PostgreSQL tables:

- **`admins`**: Admin users (user_id, password)
- **`customers`**: Customer accounts (customer_id, name, email, password)
- **`technicians`**: Service technicians (technician_id, name, phone_number, email, category, user_id, password)
- **`tickets`**: Support tickets (ticket_id, raised_date, customer_id, issue_category, issue_description, status, technician_id, technician_name, resolution_summary, resolved_date)
- **`counters`**: Sequential ID counters (ticket_counter, customer_counter, technician_counter)

All queries use parameterized statements (`$1, $2, ...`) to prevent SQL injection.

## Authentication Flow

### JWT-Based Authentication

1. **Login** (`POST /api/auth/login`):
   - Accepts `user_id_or_email` and `password`
   - Checks against `admins`, `customers`, or `technicians` tables
   - Returns JWT token with `{ id, role }` payload
   - Token expires in 24 hours

2. **Token Usage**:
   - Client sends token in `Authorization: Bearer <token>` header
   - `authMiddleware` verifies token and attaches `req.user = { id, role }`
   - `roleMiddleware` enforces role-based access control

3. **Roles**:
   - **admin**: Full system access
   - **customer**: Can create tickets and view own tickets
   - **technician**: Can view assigned tickets and update status/resolution

### Registration

- **Customer Registration** (`POST /api/auth/register`):
  - Generates sequential customer ID (CUS0001, CUS0002, ...)
  - Hashes password with bcryptjs (10 rounds)
  - Sends welcome email with credentials
  - Returns JWT token immediately

## Database Usage

### Connection Pooling

Uses `pg.Pool` for connection management:
- Automatic connection pooling
- Configurable SSL support via `DATABASE_SSL` environment variable
- Error handling for connection failures

### Query Safety

All database queries use parameterized statements:

```javascript
await db.query('SELECT * FROM customers WHERE email = $1', [email]);
```

This prevents SQL injection attacks.

### Transactions

The system uses implicit transactions for multi-step operations (e.g., ticket creation with email notification). For production, consider explicit transaction blocks for critical operations.

### ID Generation

Sequential IDs are generated using a `counters` table:
- **Tickets**: TKT0001, TKT0002, ...
- **Customers**: CUS0001, CUS0002, ...
- **Technicians**: TEC0001, TEC0002, ...

The counter table is initialized based on existing record counts if not present.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (admin, customer, technician)
- `POST /api/auth/register` - Customer registration

### Tickets
- `GET /api/tickets` - Get all tickets (admin only)
- `POST /api/tickets/customer/:customerId` - Create ticket (customer)
- `GET /api/tickets/customer/:customerId` - Get customer's tickets
- `GET /api/tickets/technician/:id` - Get technician's assigned tickets
- `PUT /api/tickets/:ticketId` - Update ticket (admin/technician)
- `DELETE /api/tickets/:ticketId` - Delete ticket (admin only)

### Customers
- `GET /api/customers` - Get all customers (admin only)
- `GET /api/customers/:customerId` - Get customer by ID (admin/customer)

### Technicians
- `GET /api/technicians` - Get all technicians (admin only)
- `POST /api/technicians` - Create technician (admin only)
- `GET /api/technicians/:technicianId` - Get technician details (admin/technician)
- `PUT /api/technicians/:technicianId` - Update technician (admin only)
- `DELETE /api/technicians/:technicianId` - Delete technician (admin only)

## Running Locally

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ticketing-system-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Strong random secret (generate with `openssl rand -base64 32`)
   - `EMAIL_*`: Email service configuration (optional, for notifications)

4. **Set up database**:
   Create the required tables in PostgreSQL. The schema includes:
   - `admins`, `customers`, `technicians`, `tickets`, `counters` tables
   - Appropriate indexes and constraints

5. **Start the server**:
   ```bash
   npm run dev
   ```
   Or:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:5000` (or the port specified in `PORT`).

### Error Handling

- If `DATABASE_URL` is not set, the server will start but display a warning. Database operations will fail gracefully.
- If the database is unavailable, connection errors are logged and requests return appropriate error responses.
- Port conflicts are handled with clear error messages.

## Key Design Decisions

1. **Role-Based Access Control**: Centralized in `roleMiddleware` for maintainability
2. **Sequential IDs**: Custom ID generation ensures human-readable ticket numbers
3. **Email Notifications**: Automated emails for ticket lifecycle events (creation, assignment, resolution)
4. **Password in Welcome Emails**: Currently sends plain passwords in welcome emails. **Production Note**: Consider password reset links instead
5. **Single JWT Secret**: All roles use the same secret. Consider separate secrets per role for enhanced security in production
6. **Connection Pooling**: Uses `pg.Pool` for efficient database connection management
7. **Error Handling**: Global error middleware catches unhandled errors and returns generic messages to clients

## Future Improvements

### Performance & Scalability
- **Redis Caching**: Cache frequently accessed data (customer details, ticket lists)
- **Message Queue**: Use Redis/Bull for email sending to avoid blocking requests
- **Database Indexing**: Add indexes on frequently queried columns (email, ticket_id, status)
- **Connection Pool Tuning**: Configure pool size based on expected load

### Security
- **Rate Limiting**: Implement rate limiting on authentication endpoints
- **Password Reset**: Replace plain password emails with secure reset links
- **Token Refresh**: Implement refresh tokens for longer sessions
- **Input Validation**: Add request validation middleware (e.g., express-validator)
- **HTTPS**: Enforce HTTPS in production

### Features
- **Ticket Comments**: Allow threaded comments on tickets
- **File Attachments**: Support file uploads for ticket evidence
- **Ticket Categories**: Expandable category system with subcategories
- **Priority Levels**: Add priority field to tickets
- **SLA Tracking**: Track and enforce service level agreements
- **Analytics Dashboard**: Aggregate statistics for admins

### Code Quality
- **Testing**: Add unit tests (Jest) and integration tests
- **API Documentation**: Generate OpenAPI/Swagger documentation
- **Logging**: Structured logging (Winston) with log levels
- **TypeScript**: Migrate to TypeScript for type safety
- **Database Migrations**: Use migration tools (node-pg-migrate, Knex)

### DevOps
- **Docker**: Containerize the application
- **CI/CD**: Automated testing and deployment pipelines
- **Monitoring**: Add application performance monitoring (APM)
- **Health Checks**: Implement `/health` endpoint for load balancers

## License

ISC

