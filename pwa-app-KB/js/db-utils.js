/**
 * Database Utilities for IndexedDB operations
 * Provides common database functions used across the application
 */

const DB_NAME = 'LaporanKBDB';
const STORE_NAME = 'laporan';
const DB_VERSION = 2;

window.dbUtils = {
    /**
     * Initialize IndexedDB database
     */
    async initializeDB() {
        return new Promise((resolve, reject) => {
            console.log('Initializing IndexedDB...');
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                const db = request.result;
                console.log('Database opened successfully');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('Database upgrade needed');
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // Create indexes
                    objectStore.createIndex('namaIstri', 'namaIstri', { unique: false });
                    objectStore.createIndex('nikIstri', 'nikIstri', { unique: false });
                    objectStore.createIndex('desa', 'desa', { unique: false });
                    objectStore.createIndex('tanggalPelayanan', 'tanggalPelayanan', { unique: false });
                    
                    console.log('Object store created with indexes');
                }
            };
        });
    },

    /**
     * Get data by NIK Istri
     */
    async getDataByNIK(db, nikIstri) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not available'));
                return;
            }
            
            console.log('Getting data by NIK:', nikIstri);
            
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            // Try to use index first
            try {
                const index = objectStore.index('nikIstri');
                const request = index.get(nikIstri);
                
                request.onsuccess = () => {
                    const result = request.result;
                    console.log('Data found by index:', !!result);
                    resolve(result);
                };
                
                request.onerror = () => {
                    console.error('Error getting data by NIK:', request.error);
                    reject(request.error);
                };
                
            } catch (indexError) {
                console.log('Index not available, scanning all records...');
                
                // Fallback: scan all records
                const getAllRequest = objectStore.getAll();
                
                getAllRequest.onsuccess = () => {
                    const allData = getAllRequest.result;
                    const found = allData.find(item => item.nikIstri === nikIstri);
                    console.log('Data found by scan:', !!found);
                    resolve(found);
                };
                
                getAllRequest.onerror = () => {
                    console.error('Error scanning records:', getAllRequest.error);
                    reject(getAllRequest.error);
                };
            }
        });
    },

    /**
     * Update data by NIK
     */
    async updateData(db, data, nikIstri) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not available'));
                return;
            }
            
            console.log('Updating data for NIK:', nikIstri);
            
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            
            // First, find the existing record
            this.getDataByNIK(db, nikIstri).then(existingData => {
                if (!existingData) {
                    reject(new Error('Data not found for NIK: ' + nikIstri));
                    return;
                }
                
                // Update the data while preserving the ID
                const updatedData = {
                    ...existingData,
                    ...data,
                    id: existingData.id, // Preserve original ID
                    nikIstri: nikIstri, // Ensure NIK doesn't change
                    timestamp: new Date().toISOString()
                };
                
                const updateRequest = objectStore.put(updatedData);
                
                updateRequest.onsuccess = () => {
                    console.log('Data updated successfully');
                    resolve(updatedData);
                };
                
                updateRequest.onerror = () => {
                    console.error('Error updating data:', updateRequest.error);
                    reject(updateRequest.error);
                };
                
            }).catch(error => {
                reject(error);
            });
        });
    },

    /**
     * Delete data by NIK
     */
    async deleteData(db, nikIstri) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not available'));
                return;
            }
            
            console.log('Deleting data for NIK:', nikIstri);
            
            // First find the record to get its ID
            this.getDataByNIK(db, nikIstri).then(existingData => {
                if (!existingData) {
                    resolve(); // Already deleted or doesn't exist
                    return;
                }
                
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const deleteRequest = objectStore.delete(existingData.id);
                
                deleteRequest.onsuccess = () => {
                    console.log('Data deleted successfully');
                    resolve();
                };
                
                deleteRequest.onerror = () => {
                    console.error('Error deleting data:', deleteRequest.error);
                    reject(deleteRequest.error);
                };
                
            }).catch(error => {
                reject(error);
            });
        });
    },

    /**
     * Get all data from store
     */
    async getAllData(db) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('Database not available'));
                return;
            }
            
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                const data = request.result;
                console.log('Retrieved all data:', data.length, 'records');
                resolve(data);
            };
            
            request.onerror = () => {
                console.error('Error getting all data:', request.error);
                reject(request.error);
            };
        });
    }
};

console.log('✅ db-utils.js loaded successfully');