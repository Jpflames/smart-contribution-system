'use client';

import { useState, useEffect, useCallback } from 'react';
import { isCloudMode, db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc as firestoreAddDoc, 
  updateDoc as firestoreUpdateDoc, 
  deleteDoc as firestoreDeleteDoc,
  setDoc as firestoreSetDoc,
  query, 
  where,
  getDocs
} from 'firebase/firestore';

// Helper to seed localStorage with rich initial data if empty
export const seedLocalStorage = () => {
  if (typeof window === 'undefined') return;

  const seeded = localStorage.getItem('coopsync_seeded');
  if (seeded === 'true') return;

  console.log('Seeding LocalStorage with mock CoopSync data...');

  const now = new Date().toISOString();

  // 1. Users Profile
  const users = [
    {
      uid: 'super-admin-uid',
      email: 'admin@dccms.com',
      role: 'super_admin',
      name: 'Sarah Connor',
      phone: '+2348011111111',
      status: 'approved',
      kycStatus: 'approved',
      coopId: null,
      createdAt: now,
      updatedAt: now
    },
    {
      uid: 'coop-admin-uid',
      email: 'coop@dccms.com',
      role: 'coop_admin',
      name: 'Adebayo Johnson',
      phone: '+2348022222222',
      status: 'approved',
      kycStatus: 'approved',
      coopId: 'coop-1',
      createdAt: now,
      updatedAt: now
    },
    {
      uid: 'treasurer-uid',
      email: 'treasurer@dccms.com',
      role: 'treasurer',
      name: 'Chinedu Okeke',
      phone: '+2348033333333',
      status: 'approved',
      kycStatus: 'approved',
      coopId: 'coop-1',
      createdAt: now,
      updatedAt: now
    },
    {
      uid: 'member-1-uid',
      email: 'member1@dccms.com',
      role: 'member',
      name: 'John Doe',
      phone: '+2348044444444',
      status: 'approved',
      kycStatus: 'approved',
      kycDetails: {
        nationalId: 'NID-987654321',
        residentialAddress: '15 Herbert Macaulay Way, Yaba, Lagos',
        occupation: 'Software Engineer',
        nextOfKin: { name: 'Mary Doe', relationship: 'Spouse', phone: '+2348055555555' }
      },
      bankDetails: {
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'John Doe'
      },
      coopId: 'coop-1',
      createdAt: now,
      updatedAt: now
    },
    {
      uid: 'member-2-uid',
      email: 'member2@dccms.com',
      role: 'member',
      name: 'Jane Smith',
      phone: '+2348066666666',
      status: 'approved',
      kycStatus: 'approved',
      kycDetails: {
        nationalId: 'NID-123456789',
        residentialAddress: '24 Allen Avenue, Ikeja, Lagos',
        occupation: 'Fashion Designer',
        nextOfKin: { name: 'David Smith', relationship: 'Brother', phone: '+2348077777777' }
      },
      bankDetails: {
        bankName: 'GTBank',
        accountNumber: '0987654321',
        accountName: 'Jane Smith'
      },
      coopId: 'coop-1',
      createdAt: now,
      updatedAt: now
    },
    {
      uid: 'member-3-uid',
      email: 'member3@dccms.com',
      role: 'member',
      name: 'Bob Johnson',
      phone: '+2348088888888',
      status: 'pending',
      kycStatus: 'pending',
      kycDetails: {
        nationalId: 'NID-555555555',
        residentialAddress: '7 Marina Road, Lagos Island, Lagos',
        occupation: 'Trader',
        nextOfKin: { name: 'Alice Johnson', relationship: 'Mother', phone: '+2348099999999' }
      },
      bankDetails: {
        bankName: 'Zenith Bank',
        accountNumber: '1122334455',
        accountName: 'Bob Johnson'
      },
      coopId: 'coop-1',
      createdAt: now,
      updatedAt: now
    }
  ];
  localStorage.setItem('coopsync_db_users', JSON.stringify(users));

  // 2. Cooperatives
  const coops = [
    {
      id: 'coop-1',
      name: 'Lagos Agri-Coop Union',
      description: 'Supporting urban farming and agricultural trade operations in Lagos state.',
      logoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=120&h=120&q=80',
      status: 'active',
      settings: {
        currency: 'NGN',
        autoDebitEnabled: true,
        retryIntervalDays: 1,
        penaltyFlatFee: 2000,
        penaltyPercentage: 5,
        penaltyType: 'flat',
        gracePeriodDays: 3,
        receiptBranding: { color: '#0f766e', headerText: 'LAGOS AGRI-COOP UNION RECEIPT' },
        webhookSecret: 'whsec_demo_key'
      },
      stats: {
        totalMembers: 3,
        activeMembers: 2,
        totalRevenue: 155000,
        totalOutstanding: 20000,
        totalDefaulters: 1
      },
      createdAt: now
    },
    {
      id: 'coop-2',
      name: 'Tech Innovators Credit Cooperative',
      description: 'Fintech and tech professional credit contributions and low-interest equipment loans.',
      logoUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=120&h=120&q=80',
      status: 'active',
      settings: {
        currency: 'USD',
        autoDebitEnabled: true,
        retryIntervalDays: 1,
        penaltyFlatFee: 10,
        penaltyPercentage: 2,
        penaltyType: 'percentage',
        gracePeriodDays: 5,
        receiptBranding: { color: '#6366f1', headerText: 'TECH INNOVATORS COOP INC.' },
        webhookSecret: 'whsec_tech_demo'
      },
      stats: {
        totalMembers: 0,
        activeMembers: 0,
        totalRevenue: 0,
        totalOutstanding: 0,
        totalDefaulters: 0
      },
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_cooperatives', JSON.stringify(coops));

  // 3. Contribution Plans
  const plans = [
    {
      id: 'plan-1',
      coopId: 'coop-1',
      name: 'Monthly Gold Harvest Plan',
      amount: 50000,
      frequency: 'monthly',
      dueDay: 5,
      gracePeriodDays: 3,
      penaltyFee: 2000,
      maxMembers: 100,
      autoDebitEnabled: true,
      reminderSchedule: [1, 3],
      exitRules: 'Minimum contribution period of 6 months. Exit attracts a 5% administrative charge.',
      createdAt: now
    },
    {
      id: 'plan-2',
      coopId: 'coop-1',
      name: 'Weekly Silver Crop Saver',
      amount: 15000,
      frequency: 'weekly',
      dueDay: 1, // Monday
      gracePeriodDays: 2,
      penaltyFee: 500,
      maxMembers: 200,
      autoDebitEnabled: true,
      reminderSchedule: [1],
      exitRules: 'Flexible exit with 48 hours notice.',
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_plans', JSON.stringify(plans));

  // 4. Payment Tokens (Pre-linked authorizations)
  const tokens = [
    {
      id: 'token-1',
      userId: 'member-1-uid',
      coopId: 'coop-1',
      customerCode: 'CUS_john_doe_demo',
      authorizationCode: 'AUTH_success_token',
      cardType: 'visa',
      last4: '4242',
      expMonth: '12',
      expYear: '2028',
      createdAt: now
    },
    {
      id: 'token-2',
      userId: 'member-2-uid',
      coopId: 'coop-1',
      customerCode: 'CUS_jane_smith_demo',
      authorizationCode: 'AUTH_failing_token',
      cardType: 'mastercard',
      last4: '5555',
      expMonth: '10',
      expYear: '2027',
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_paymentTokens', JSON.stringify(tokens));

  // 5. Wallets
  const wallets = [
    {
      id: 'member-1-uid',
      userId: 'member-1-uid',
      coopId: 'coop-1',
      balance: 150000,
      ledgerBalance: 150000,
      currency: 'NGN',
      lastUpdated: now
    },
    {
      id: 'member-2-uid',
      userId: 'member-2-uid',
      coopId: 'coop-1',
      balance: 5000,
      ledgerBalance: 5000,
      currency: 'NGN',
      lastUpdated: now
    },
    {
      id: 'member-3-uid',
      userId: 'member-3-uid',
      coopId: 'coop-1',
      balance: 0,
      ledgerBalance: 0,
      currency: 'NGN',
      lastUpdated: now
    }
  ];
  localStorage.setItem('coopsync_db_wallets', JSON.stringify(wallets));

  // 6. Payments history
  const payments = [
    {
      id: 'pay-1',
      userId: 'member-1-uid',
      userName: 'John Doe',
      coopId: 'coop-1',
      planId: 'plan-1',
      planName: 'Monthly Gold Harvest Plan',
      amount: 50000,
      penaltyAmount: 0,
      totalAmount: 50000,
      status: 'success',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_1010101',
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 5).toISOString().split('T')[0],
      paidAt: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 5).toISOString(),
      failureReason: null,
      retryCount: 0,
      createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 5).toISOString()
    },
    {
      id: 'pay-2',
      userId: 'member-1-uid',
      userName: 'John Doe',
      coopId: 'coop-1',
      planId: 'plan-1',
      planName: 'Monthly Gold Harvest Plan',
      amount: 50000,
      penaltyAmount: 0,
      totalAmount: 50000,
      status: 'success',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_1020202',
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5).toISOString().split('T')[0],
      paidAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5).toISOString(),
      failureReason: null,
      retryCount: 0,
      createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5).toISOString()
    },
    {
      id: 'pay-3',
      userId: 'member-1-uid',
      userName: 'John Doe',
      coopId: 'coop-1',
      planId: 'plan-1',
      planName: 'Monthly Gold Harvest Plan',
      amount: 50000,
      penaltyAmount: 0,
      totalAmount: 50000,
      status: 'success',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_1030303',
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
      paidAt: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(),
      failureReason: null,
      retryCount: 0,
      createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString()
    },
    {
      id: 'pay-4',
      userId: 'member-2-uid',
      userName: 'Jane Smith',
      coopId: 'coop-1',
      planId: 'plan-2',
      planName: 'Weekly Silver Crop Saver',
      amount: 15000,
      penaltyAmount: 0,
      totalAmount: 15000,
      status: 'success',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_2010101',
      dueDate: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidAt: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      failureReason: null,
      retryCount: 0,
      createdAt: new Date(new Date().getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pay-5',
      userId: 'member-2-uid',
      userName: 'Jane Smith',
      coopId: 'coop-1',
      planId: 'plan-2',
      planName: 'Weekly Silver Crop Saver',
      amount: 15000,
      penaltyAmount: 500,
      totalAmount: 15500,
      status: 'failed',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_2020202_fail',
      dueDate: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidAt: null,
      failureReason: 'Insufficient Funds',
      retryCount: 3,
      createdAt: new Date(new Date().getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pay-6',
      userId: 'member-2-uid',
      userName: 'Jane Smith',
      coopId: 'coop-1',
      planId: 'plan-2',
      planName: 'Weekly Silver Crop Saver',
      amount: 15000,
      penaltyAmount: 500,
      totalAmount: 15500,
      status: 'overdue',
      paymentMethod: 'card',
      gateway: 'paystack',
      gatewayRef: 'ref_2030303_fail',
      dueDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidAt: null,
      failureReason: 'Card Expired',
      retryCount: 3,
      createdAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('coopsync_db_payments', JSON.stringify(payments));

  // 7. Withdrawal Requests
  const withdrawals = [
    {
      id: 'w-1',
      userId: 'member-1-uid',
      userName: 'John Doe',
      coopId: 'coop-1',
      amount: 40000,
      bankDetails: {
        bankName: 'Access Bank',
        accountNumber: '0123456789',
        accountName: 'John Doe'
      },
      status: 'approved',
      processedBy: 'treasurer-uid',
      processedAt: now,
      createdAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'w-2',
      userId: 'member-2-uid',
      userName: 'Jane Smith',
      coopId: 'coop-1',
      amount: 12000,
      bankDetails: {
        bankName: 'GTBank',
        accountNumber: '0987654321',
        accountName: 'Jane Smith'
      },
      status: 'pending',
      processedBy: null,
      processedAt: null,
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_withdrawalRequests', JSON.stringify(withdrawals));

  // 8. Loans
  const loans = [
    {
      id: 'loan-1',
      userId: 'member-1-uid',
      userName: 'John Doe',
      coopId: 'coop-1',
      amount: 250000,
      interestRate: 6,
      durationMonths: 6,
      monthlyInstallment: 44166.67,
      outstandingBalance: 176666.68,
      eligibilityScore: 84,
      status: 'active',
      createdAt: new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('coopsync_db_loans', JSON.stringify(loans));

  // 9. Audit Logs
  const auditLogs = [
    {
      id: 'log-1',
      userId: 'coop-admin-uid',
      userEmail: 'coop@dccms.com',
      action: 'Create Plan',
      details: 'Created Weekly Silver Crop Saver Plan',
      createdAt: now
    },
    {
      id: 'log-2',
      userId: 'treasurer-uid',
      userEmail: 'treasurer@dccms.com',
      action: 'Approve Withdrawal',
      details: 'Approved withdrawal request of 40,000 NGN for John Doe',
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_auditLogs', JSON.stringify(auditLogs));

  // 10. Notifications
  const notifications = [
    {
      id: 'notif-1',
      userId: 'member-1-uid',
      title: 'Auto Debit Successful',
      message: 'Your monthly contribution of 50,000 NGN for Monthly Gold Harvest Plan was successfully charged.',
      type: 'success',
      read: false,
      createdAt: now
    },
    {
      id: 'notif-2',
      userId: 'member-2-uid',
      title: 'Debit Failed',
      message: 'Attempt to charge your card for Weekly Silver Crop Saver failed (Insufficient Funds). A retry is scheduled.',
      type: 'warning',
      read: false,
      createdAt: now
    }
  ];
  localStorage.setItem('coopsync_db_notifications', JSON.stringify(notifications));

  localStorage.setItem('coopsync_seeded', 'true');
  console.log('LocalStorage seeding complete!');
};

// Generic read operations
const getLocalData = (collectionName: string): any[] => {
  if (typeof window === 'undefined') return [];
  seedLocalStorage();
  const data = localStorage.getItem(`coopsync_db_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

// Generic write operations
const setLocalData = (collectionName: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`coopsync_db_${collectionName}`, JSON.stringify(data));
  // Dispatch custom event to notify other hooks on the page
  window.dispatchEvent(new Event('coopsync_db_changed'));
};

// -------------------------------------------------------------
// CLIENT HOOKS EXPORTS
// -------------------------------------------------------------

export function useCollection<T = any>(collectionName: string, filters?: { field: keyof T; operator: '==' | '!='; value: any }[]) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(() => {
    if (isCloudMode) {
      const qRef = collection(db, collectionName);
      let queryRef: any = qRef;
      if (filters && filters.length > 0) {
        const firestoreWhereClauses = filters.map(f => where(f.field as string, f.operator, f.value));
        queryRef = query(qRef, ...firestoreWhereClauses);
      }
      
      const unsubscribe = onSnapshot(
        queryRef,
        (snapshot: any) => {
          const items: any[] = [];
          snapshot.forEach((docSnap: any) => {
            items.push({ id: docSnap.id, ...docSnap.data() });
          });
          setData(items);
          setLoading(false);
        },
        (error: any) => {
          console.warn(`Firestore collection snapshot listener failed: ${error.message}`);
          setLoading(false);
        }
      );
      return unsubscribe;
    } else {
      let localItems = getLocalData(collectionName);
      if (filters && filters.length > 0) {
        localItems = localItems.filter(item => {
          return filters.every(f => {
            if (f.operator === '==') {
              return item[f.field] === f.value;
            } else {
              return item[f.field] !== f.value;
            }
          });
        });
      }
      setData(localItems);
      setLoading(false);

      const handleStorageChange = () => {
        let freshLocalItems = getLocalData(collectionName);
        if (filters && filters.length > 0) {
          freshLocalItems = freshLocalItems.filter(item => {
            return filters.every(f => {
              if (f.operator === '==') {
                return item[f.field] === f.value;
              } else {
                return item[f.field] !== f.value;
              }
            });
          });
        }
        setData(freshLocalItems);
      };

      window.addEventListener('coopsync_db_changed', handleStorageChange);
      return () => window.removeEventListener('coopsync_db_changed', handleStorageChange);
    }
  }, [collectionName, JSON.stringify(filters)]);

  useEffect(() => {
    const unsub = fetchItems();
    return () => {
      if (unsub) unsub();
    };
  }, [fetchItems]);

  return { data, loading };
}

export function useDocument<T = any>(collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    if (isCloudMode) {
      const docRef = doc(db, collectionName, docId);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setData({ id: docSnap.id, ...docSnap.data() } as any);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (error: any) => {
          console.warn(`Firestore document snapshot listener failed: ${error.message}`);
          setLoading(false);
        }
      );
      return unsubscribe;
    } else {
      const fetchDoc = () => {
        const localItems = getLocalData(collectionName);
        const matched = localItems.find(item => item.id === docId || item.uid === docId);
        setData(matched || null);
        setLoading(false);
      };

      fetchDoc();
      window.addEventListener('coopsync_db_changed', fetchDoc);
      return () => window.removeEventListener('coopsync_db_changed', fetchDoc);
    }
  }, [collectionName, docId]);

  return { data, loading };
}

// Data mutating API wrappers
export async function addDocument(collectionName: string, docData: any): Promise<string> {
  const now = new Date().toISOString();
  const enhancedData = {
    ...docData,
    createdAt: now,
    updatedAt: now,
  };

  if (isCloudMode) {
    const ref = await firestoreAddDoc(collection(db, collectionName), enhancedData);
    return ref.id;
  } else {
    const localItems = getLocalData(collectionName);
    const id = enhancedData.id || `doc_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = { id, ...enhancedData };
    localItems.push(newItem);
    setLocalData(collectionName, localItems);
    return id;
  }
}

export async function setDocument(collectionName: string, docId: string, docData: any): Promise<void> {
  const now = new Date().toISOString();
  const enhancedData = {
    ...docData,
    updatedAt: now,
  };

  if (isCloudMode) {
    const docRef = doc(db, collectionName, docId);
    await firestoreSetDoc(docRef, enhancedData, { merge: true });
  } else {
    const localItems = getLocalData(collectionName);
    const index = localItems.findIndex(item => item.id === docId || item.uid === docId);
    
    if (index !== -1) {
      localItems[index] = { ...localItems[index], ...enhancedData };
    } else {
      // If it doesn't exist, create it (like setDoc behavior)
      localItems.push({ id: docId, uid: docId, ...enhancedData, createdAt: now });
    }
    setLocalData(collectionName, localItems);
  }
}

export async function updateDocument(collectionName: string, docId: string, docData: any): Promise<void> {
  const now = new Date().toISOString();
  const enhancedData = {
    ...docData,
    updatedAt: now,
  };

  if (isCloudMode) {
    const docRef = doc(db, collectionName, docId);
    await firestoreUpdateDoc(docRef, enhancedData);
  } else {
    const localItems = getLocalData(collectionName);
    const index = localItems.findIndex(item => item.id === docId || item.uid === docId);
    if (index !== -1) {
      localItems[index] = { ...localItems[index], ...enhancedData };
      setLocalData(collectionName, localItems);
    } else {
      throw new Error(`Document with ID ${docId} not found in collection ${collectionName}`);
    }
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  if (isCloudMode) {
    const docRef = doc(db, collectionName, docId);
    await firestoreDeleteDoc(docRef);
  } else {
    const localItems = getLocalData(collectionName);
    const filtered = localItems.filter(item => item.id !== docId && item.uid !== docId);
    setLocalData(collectionName, filtered);
  }
}

// Helper to query single items directly in actions or callbacks
export async function getDocumentById(collectionName: string, docId: string): Promise<any | null> {
  if (isCloudMode) {
    const docRef = doc(db, collectionName, docId);
    const querySnapshot = await getDocs(query(collection(db, collectionName), where('__name__', '==', docId)));
    if (!querySnapshot.empty) {
      const first = querySnapshot.docs[0];
      return { id: first.id, ...first.data() };
    }
    return null;
  } else {
    const localItems = getLocalData(collectionName);
    return localItems.find(item => item.id === docId || item.uid === docId) || null;
  }
}

export async function queryDocuments(collectionName: string, filters: { field: string; operator: '==' | '!='; value: any }[]): Promise<any[]> {
  if (isCloudMode) {
    const qRef = collection(db, collectionName);
    const firestoreWhereClauses = filters.map(f => where(f.field, f.operator, f.value));
    const queryRef = query(qRef, ...firestoreWhereClauses);
    const querySnapshot = await getDocs(queryRef);
    const items: any[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } else {
    let localItems = getLocalData(collectionName);
    if (filters && filters.length > 0) {
      localItems = localItems.filter(item => {
        return filters.every(f => {
          if (f.operator === '==') {
            return item[f.field] === f.value;
          } else {
            return item[f.field] !== f.value;
          }
        });
      });
    }
    return localItems;
  }
}
