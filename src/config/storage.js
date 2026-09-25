import EncryptedStorage from 'react-native-encrypted-storage';
import CryptoJS from 'crypto-js';
import { SECRET_KEY } from '../config/constant';

function encryptData(data, key) {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    let encryptvalue = CryptoJS.AES.encrypt(stringData, key);
    return encryptvalue;
}

function decryptData(encryptedData, key) {
    const decipher = CryptoJS.AES.decrypt(encryptedData.toString(), key);
    let decrypted = decipher.toString(CryptoJS.enc.Utf8);
    return decrypted;
}

export async function storeEncryptedData(key, data) {
    try {
        console.log(`[Storage] Storing key: "${key}"`);
        const encryptedData = encryptData(data, SECRET_KEY);
        await EncryptedStorage.setItem(key, encryptedData.toString());
        console.log(`[Storage] Successfully stored key: "${key}"`);
    } catch (error) {
        console.error(`[Storage] Error storing key: "${key}"`, error);
    }
}

export async function retrieveEncryptedData(key) {
    try {
        console.log(`[Storage] Retrieving key: "${key}"`);
        const encryptedData = await EncryptedStorage.getItem(key);
        if (encryptedData) {
            const decryptedData = decryptData(encryptedData, SECRET_KEY);
            console.log(`[Storage] Successfully retrieved and decrypted key: "${key}". Value length: ${decryptedData ? decryptedData.length : 0}`);
            return decryptedData;
        } else {
            console.log(`[Storage] Key not found or empty: "${key}"`);
            return null;
        }
    } catch (error) {
        console.error(`[Storage] Error retrieving key: "${key}"`, error);
        return null;
    }
}

export async function removeEncryptedData(key) {
    try {
        console.log(`[Storage] Removing key: "${key}"`);
        await EncryptedStorage.removeItem(key);
        console.log(`[Storage] Successfully removed key: "${key}"`);
    } catch (error) {
        console.error(`[Storage] Error removing key: "${key}"`, error);
    }
}

export function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

