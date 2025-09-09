import path from 'path';
import Datastore from 'nedb';
import bcrypt from 'bcryptjs';
import { Doctor, Order, User, Notification, Payment, Note } from '../../types'; // Import necessary types

const saltRounds = 10;

// Define the structure of the db object
interface AppDatabase {
  doctors: Datastore<Doctor>;
  orders: Datastore<Order>;
  users: Datastore<User>;
  notifications: Datastore<Notification>;
}

// Define a fixed path for the database files relative to the project root
const dbPath = path.resolve(process.cwd(), 'data');


const db: AppDatabase = {
  doctors: new Datastore<Doctor>({ filename: path.join(dbPath, 'doctors.db'), autoload: true }),
  orders: new Datastore<Order>({ filename: path.join(dbPath, 'orders.db'), autoload: true }),
  users: new Datastore<User>({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  notifications: new Datastore<Notification>({ filename: path.join(dbPath, 'notifications.db'), autoload: true }),
};

// Function to initialize data if the database is empty
const initializeDb = (): void => {
    db.doctors.count({}, (err: Error | null, count: number) => {
        if (err) {
            console.error('Error counting doctors:', err);
            return;
        }
        if (count === 0) {
            console.log('Doctors database is empty, inserting initial data...');
            const initialDoctors: Partial<Doctor>[] = [
                { title: 'Dr.', firstName: 'Juan', lastName: 'Pérez', email: 'juan.perez@example.com', phone: '555-1234', address: 'Calle Falsa 123, Caracas' },
                { title: 'Dra.', firstName: 'María', lastName: 'García', email: 'maria.garcia@example.com', phone: '555-5678', address: 'Av. Siempre Viva 456, Maracaibo' },
                { title: 'Est.', firstName: 'Carlos', lastName: 'López', email: 'carlos.lopez@example.com', phone: '555-9012', address: 'Blvd. de los Sueños 789, Valencia' },
            ];
            db.doctors.insert(initialDoctors as Doctor[], (insertErr, newDocs) => {
                if (insertErr) {
                    console.error('Error inserting initial doctors:', insertErr);
                    return;
                }
                console.log('Initial doctors inserted.');

                db.orders.count({}, (orderErr, orderCount) => {
                    if (orderErr) {
                        console.error('Error counting orders:', orderErr);
                        return;
                    }
                    if (orderCount === 0) {
                        console.log('Orders database is empty, inserting initial data...');
                        const initialOrders: Partial<Order>[] = [
                            {
                                doctorId: newDocs[0]._id, patientName: 'Ana Rodríguez', jobType: 'PRÓTESIS FIJA - Corona Total Cerámica (DISILICATO)',
                                cost: 1200, status: 'Procesando', creationDate: '2025-07-20T10:00:00Z',
                                priority: 'Alta', caseDescription: 'Paciente requiere corona total de disilicato.',
                                payments: [ { amount: 500, date: '2025-07-20', description: 'Depósito inicial' } as Payment ],
                                notes: [ { text: 'Paciente requiere corona total de disilicato.', timestamp: '2025-07-20T10:00:00Z', author: 'Usuario' } as Note ]
                            },
                            {
                                doctorId: newDocs[1]._id, patientName: 'Luis Fernández', jobType: 'ACRÍLICO - Prótesis Totales',
                                cost: 300, status: 'Completado', creationDate: '2025-07-25T14:30:00Z',
                                completionDate: '2025-07-28T16:00:00Z',
                                priority: 'Normal', caseDescription: 'Prótesis totales para paciente.',
                                payments: [ { amount: 300, date: '2025-07-25', description: 'Pago completo' } as Payment ],
                                notes: []
                            },
                            {
                                doctorId: newDocs[0]._id, patientName: 'Sofía Martínez', jobType: 'FLEXIBLE - De 1 a 6 Unidades',
                                cost: 400, status: 'Pendiente', creationDate: '2025-08-01T09:15:00Z',
                                priority: 'Urgente', caseDescription: 'Prótesis flexible de 3 unidades.',
                                payments: [ { amount: 100, date: '2025-08-01', description: 'Anticipo' } as Payment ],
                                notes: [ { text: 'Caso complejo, requiere seguimiento.', timestamp: '2025-08-01T14:30:00Z', author: 'Usuario' } as Note ]
                            },
                            {
                                doctorId: newDocs[2]._id, patientName: 'Pedro Gómez', jobType: 'FLUJO DIGITAL - Corona Impresa',
                                cost: 250, status: 'Pendiente', creationDate: '2025-08-05T11:00:00Z',
                                priority: 'Baja', caseDescription: 'Corona impresa para premolar.',
                                payments: [],
                                notes: []
                            },
                        ];
                        db.orders.insert(initialOrders as Order[], (insertErr) => {
                            if (insertErr) console.error('Error inserting initial orders:', insertErr);
                            else console.log('Initial orders inserted.');
                        });
                    }
                });
            });
        }
    });

    db.users.count({}, (err: Error | null, count: number) => {
        if (err) {
            console.error('Error counting users:', err);
            return;
        }
        if (count === 0) {
            console.log('Users database is empty, inserting initial data with hashed passwords...');
            const initialUsers: User[] = [
                {
                    username: 'admin',
                    password: bcrypt.hashSync('password', saltRounds),
                    securityQuestion: '¿Cuál es el nombre de tu primera mascota?',
                    securityAnswer: bcrypt.hashSync('Buddy', saltRounds)
                },
                {
                    username: 'user1',
                    password: bcrypt.hashSync('pass1', saltRounds),
                    securityQuestion: '¿Cuál es tu color favorito?',
                    securityAnswer: bcrypt.hashSync('Azul', saltRounds)
                },
            ];
            db.users.insert(initialUsers, (insertErr: Error | null) => {
                if (insertErr) console.error('Error inserting initial users:', insertErr);
                else console.log('Initial users inserted.');
            });
        }
    });
};

export {
    db,
    initializeDb,
};
