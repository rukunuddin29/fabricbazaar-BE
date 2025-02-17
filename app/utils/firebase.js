const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } = require("firebase/storage");
const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId } = require("../config/config");

const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId };

initializeApp(firebaseConfig);

const storage = getStorage();

const upload_on_cloud = async (imageData, folderName) => {
    const storageRef = ref(storage, `fabricbazar/${folderName}/${imageData.originalname}`);
    const metaData = { contentType: imageData.mimetype };
    const snapShot = await uploadBytesResumable(storageRef, imageData.buffer, metaData);
    const downloadUrl = await getDownloadURL(snapShot.ref);
    return downloadUrl;
};

const deleteFromFirebase = async (url) => {
    try {
        const desertRef = ref(storage, url);
        await deleteObject(desertRef);
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = { upload_on_cloud, deleteFromFirebase };
