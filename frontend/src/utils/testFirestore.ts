/**
 * Utility to test Firestore connectivity and permissions
 */
import { db } from '@/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';

export const testFirestore = async () => {
  const results = {
    read: false,
    write: false,
    error: null as string | null,
  };

  try {
    // Test read
    console.log('Testing Firestore read...');
    const testCollection = collection(db, 'Ingredients');
    await getDocs(testCollection);
    results.read = true;
    console.log('✓ Read test passed');

    // Test write with a temporary document
    console.log('Testing Firestore write...');
    const testDoc = await addDoc(testCollection, {
      Name: '__TEST__',
      Category: '__TEST__',
      Image: '__TEST__',
      _test: true,
      _timestamp: new Date().toISOString(),
    });
    console.log('✓ Write test passed, document ID:', testDoc.id);

    // Clean up test document
    try {
      await deleteDoc(doc(db, 'Ingredients', testDoc.id));
      console.log('✓ Test document cleaned up');
    } catch (cleanupError) {
      console.warn('Could not clean up test document:', cleanupError);
    }

    results.write = true;
  } catch (error: any) {
    console.error('Firestore test failed:', error);
    results.error = error?.message || 'Unknown error';
    results.read = error?.code !== 'permission-denied';
    results.write = false;

    if (error?.code === 'permission-denied') {
      results.error = 'Permission denied. Please check Firestore security rules.';
    } else if (error?.code === 'unavailable') {
      results.error = 'Firestore is unavailable. Check your internet connection.';
    }
  }

  return results;
};

