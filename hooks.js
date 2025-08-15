const API_URL = 'http://localhost:8000/predict'; // Replace once container is deployed

/**
 * Sends an audio file to the prediction API with progress tracking
 * @param {File} audioFile - The audio file to analyze
 * @param {Function} onProgress - Callback function that receives upload progress (0-100)
 * @returns {Promise<Object>} - The prediction result
 */
async function predictAudio(audioFile, onProgress) {

    if (!audioFile || audioFile.size === 0) {
        return Promise.reject(new Error('File is empty or invalid'));
    }

    const formData = new FormData();
    formData.append('file', audioFile);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (onProgress) onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    reject(new Error('Failed to parse response'));
                }
            } else {
                let error;
                try {
                    const response = JSON.parse(xhr.responseText);
                    error = new Error(response.detail || 'Failed to get prediction');
                } catch (e) {
                    error = new Error(`Request failed with status ${xhr.status}`);
                }
                reject(error);
            }
        };

        xhr.onerror = () => {
            reject(new Error('Network error occurred'));
        };

        xhr.open('POST', API_URL, true);
        xhr.send(formData);
    });
}