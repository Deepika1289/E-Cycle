import { Document, Types } from 'mongoose';

export interface IZone extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  boundary: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  center: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: 'ACTIVE' | 'INACTIVE';
  cycleCapacity: number;
  manager?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  externalId?: string;
  password: string;
  name: string;
  phone: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  walletBalance: number;
  isVerified: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'ACTIVE' | 'SUSPENDED';
  otpCode?: string | null;
  otpExpiresAt?: Date | null;
  avatar?: string;
  preferences: {
    favoriteStations: Types.ObjectId[];
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IStation extends Document {
  _id: Types.ObjectId;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  capacity: number;
  availableCycles: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  facilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICycle {
  _id: Types.ObjectId;
  code: string;
  model: string;
  cycleModel: string;
  batteryLevel?: number;
  status: 'AVAILABLE' | 'BOOKED' | 'IN_USE' | 'MAINTENANCE' | 'INACTIVE';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  station?: Types.ObjectId;
  zone?: Types.ObjectId;
  qrCode: string;
  imageUrl?: string;
  lastMaintenance: Date;
  totalRides: number;
  totalDistance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  cycle: Types.ObjectId;
  startStation: Types.ObjectId;
  endStation: Types.ObjectId;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startTime: Date;
  endTime: Date;
  duration: number;
  estimatedCost: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IRide extends Document {
  _id: Types.ObjectId;
  booking: Types.ObjectId;
  user: Types.ObjectId;
  cycle: Types.ObjectId;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startLocation: {
    type: 'Point';
    coordinates: [number, number];
  };
  endLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  route: Array<{
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
    timestamp: Date;
  }>;
  startTime: Date;
  endTime?: Date;
  distance: number;
  duration: number;
  cost: number;
  cancellation?: {
    cancelledBy: Types.ObjectId;
    reason: string;
    cancelTime: Date;
    refundStatus?: 'PENDING' | 'PROCESSED' | 'DECLINED';
  };
  scheduledEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  booking?: Types.ObjectId;
  type: 'RIDE' | 'WALLET_TOPUP' | 'REFUND';
  method: 'CARD' | 'UPI' | 'WALLET';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  gatewayResponse?: any;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIssue extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  cycle?: Types.ObjectId;
  station?: Types.ObjectId;
  type: 'CYCLE_DAMAGE' | 'PAYMENT_ISSUE' | 'APP_BUG' | 'STATION_ISSUE' | 'OTHER';
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: Types.ObjectId;
  resolution?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}