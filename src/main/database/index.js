"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.initializeDb = exports.db = void 0;
var mongoose_1 = require("mongoose");
var bcrypt = require("bcryptjs");
var saltRounds = 10;
// MongoDB Connection String (replace with environment variable in production)
var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dental_lab_app'; // Use environment variable for production
// 1. Define Mongoose Schemas
var paymentSchema = new mongoose_1.default.Schema({
    amount: { type: Number, required: true },
    date: { type: String, required: true }, // Consider using Date type
    description: { type: String },
});
var noteSchema = new mongoose_1.default.Schema({
    text: { type: String, required: true },
    timestamp: { type: String, required: true }, // Consider using Date type
    author: { type: String, required: true },
});
var doctorSchema = new mongoose_1.default.Schema({
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
});
var orderSchema = new mongoose_1.default.Schema({
    doctorId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientName: { type: String, required: true },
    jobType: { type: String, required: true },
    cost: { type: Number, required: true },
    status: { type: String, required: true },
    creationDate: { type: String, required: true }, // Consider using Date type
    completionDate: { type: String }, // Consider using Date type
    priority: { type: String },
    caseDescription: { type: String },
    payments: [paymentSchema],
    notes: [noteSchema],
});
var userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
});
var notificationSchema = new mongoose_1.default.Schema({
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
}, { timestamps: true }); // Fixed
// 2. Create Mongoose Models
var DoctorModel = mongoose_1.default.model('Doctor', doctorSchema);
var OrderModel = mongoose_1.default.model('Order', orderSchema);
var UserModel = mongoose_1.default.model('User', userSchema);
var NotificationModel = mongoose_1.default.model('Notification', notificationSchema);
var db = {
    doctors: DoctorModel,
    orders: OrderModel,
    users: UserModel,
    notifications: NotificationModel,
};
exports.db = db;
// 3. Connect to MongoDB
var connectDB = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI)];
            case 1:
                _a.sent();
                console.log('MongoDB connected successfully!');
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.error('MongoDB connection error:', err_1);
                process.exit(1); // Exit process with failure
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.connectDB = connectDB;
// 4. Function to initialize data if the database is empty
var initializeDb = function () { return __awaiter(void 0, void 0, void 0, function () {
    var doctorCount, initialDoctors, newDocs, orderCount, initialOrders, userCount, initialUsers, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 9, , 10]);
                return [4 /*yield*/, db.doctors.countDocuments({})];
            case 1:
                doctorCount = _a.sent();
                if (!(doctorCount === 0)) return [3 /*break*/, 5];
                console.log('Doctors collection is empty, inserting initial data...');
                initialDoctors = [
                    { title: 'Dr.', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@example.com', phone: '555-1234', address: 'Calle Falsa 123, Caracas' },
                    { title: 'Dra.', firstName: 'María', lastName: 'García', email: '555-5678', address: 'Av. Siempre Viva 456, Maracaibo' },
                    { title: 'Est.', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@example.com', phone: '555-9012', address: 'Blvd. de los Sueños 789, Valencia' },
                ];
                return [4 /*yield*/, db.doctors.insertMany(initialDoctors)];
            case 2:
                newDocs = _a.sent();
                console.log('Initial doctors inserted.');
                return [4 /*yield*/, db.orders.countDocuments({})];
            case 3:
                orderCount = _a.sent();
                if (!(orderCount === 0)) return [3 /*break*/, 5];
                console.log('Orders collection is empty, inserting initial data...');
                initialOrders = [
                    {
                        doctorId: newDocs[0]._id, patientName: 'Ana Rodríguez', jobType: 'PRÓTESIS FIJA - Corona Total Cerámica (DISILICATO)',
                        cost: 1200, status: 'Procesando', creationDate: '2025-07-20T10:00:00Z',
                        priority: 'Alta', caseDescription: 'Paciente requiere corona total de disilicato.',
                        payments: [{ amount: 500, date: '2025-07-20', description: 'Depósito inicial' }],
                        notes: [{ text: 'Paciente requiere corona total de disilicato.', timestamp: '2025-07-20T10:00:00Z', author: 'Usuario' }]
                    },
                    {
                        doctorId: newDocs[1]._id, patientName: 'Luis Fernández', jobType: 'ACRÍLICO - Prótesis Totales',
                        cost: 300, status: 'Completado', creationDate: '2025-07-25T14:30:00Z',
                        completionDate: '2025-07-28T16:00:00Z',
                        priority: 'Normal', caseDescription: 'Prótesis totales para paciente.',
                        payments: [{ amount: 300, date: '2025-07-25', description: 'Pago completo' }],
                        notes: []
                    },
                    {
                        doctorId: newDocs[0]._id, patientName: 'Sofía Martínez', jobType: 'FLEXIBLE - De 1 a 6 Unidades',
                        cost: 400, status: 'Pendiente', creationDate: '2025-08-01T09:15:00Z',
                        priority: 'Urgente', caseDescription: 'Prótesis flexible de 3 unidades.',
                        payments: [{ amount: 100, date: '2025-08-01', description: 'Anticipo' }],
                        notes: [{ text: 'Caso complejo, requiere seguimiento.', timestamp: '2025-08-01T14:30:00Z', author: 'Usuario' }]
                    },
                    {
                        doctorId: newDocs[2]._id, patientName: 'Pedro Gómez', jobType: 'FLUJO DIGITAL - Corona Impresa',
                        cost: 250, status: 'Pendiente', creationDate: '2025-08-05T11:00:00Z',
                        priority: 'Baja', caseDescription: 'Corona impresa para premolar.',
                        payments: [],
                        notes: []
                    },
                ];
                return [4 /*yield*/, db.orders.insertMany(initialOrders)];
            case 4:
                _a.sent();
                console.log('Initial orders inserted.');
                _a.label = 5;
            case 5: return [4 /*yield*/, db.users.countDocuments({})];
            case 6:
                userCount = _a.sent();
                if (!(userCount === 0)) return [3 /*break*/, 8];
                console.log('Users collection is empty, inserting initial data with hashed passwords...');
                initialUsers = [
                    { username: 'admin', password: bcrypt.hashSync('password', saltRounds), securityQuestion: '¿Cuál es el nombre de tu primera mascota?', securityAnswer: bcrypt.hashSync('Buddy', saltRounds) },
                    { username: 'user1', password: bcrypt.hashSync('pass1', saltRounds), securityQuestion: '¿Cuál es tu color favorito?', securityAnswer: bcrypt.hashSync('Azul', saltRounds) },
                ];
                return [4 /*yield*/, db.users.insertMany(initialUsers)];
            case 7:
                _a.sent();
                console.log('Initial users inserted.');
                _a.label = 8;
            case 8: return [3 /*break*/, 10];
            case 9:
                error_1 = _a.sent();
                console.error('Error initializing database:', error_1);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.initializeDb = initializeDb;
// Call connectDB when the module is loaded, but don't initializeDb here
// initializeDb will be called after successful connection in server.ts
