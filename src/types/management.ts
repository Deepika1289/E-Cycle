export interface Cycle {
  _id: string;
  code: string;
  model: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
  batteryLevel?: number;
  lastMaintenance?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Ride {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  cycle: {
    _id: string;
    code: string;
  };
  startTime: string;
  endTime?: string;
  startLocation: {
    type: string;
    coordinates: [number, number];
  };
  endLocation?: {
    type: string;
    coordinates: [number, number];
  };
  distance?: number;
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  fare?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  _id: string;
  name: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  capacity: number;
  availableBikes: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  settings: {
    maxBikes: number;
    operatingHours: {
      open: string;
      close: string;
    };
    isOperational: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  type: 'BIKE_ISSUE' | 'STATION_ISSUE' | 'PAYMENT_ISSUE' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  relatedTo?: {
    type: 'BIKE' | 'STATION' | 'RIDE' | 'PAYMENT';
    id: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}
