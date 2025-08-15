document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('audio-upload');
  const uploadContainer = document.querySelector('.upload-container');
  const fileList = document.getElementById('file-list');

  // Handle file selection
  fileInput.addEventListener('change', handleFileSelect);

  // Drag and drop handlers
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadContainer.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    uploadContainer.classList.add('drag-over');
  }

  function unhighlight() {
    uploadContainer.classList.remove('drag-over');
  }

  // Handle dropped files
  uploadContainer.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }

  function handleFiles(files) {
    [...files].forEach(file => {
      if (file.type.startsWith('audio/')) {
        addFileToList(file);
      }
    });
  }

  function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileName = file.name;

    const fileSize = formatFileSize(file.size);

    fileItem.innerHTML = `
      <div class="file-icon">🎵</div>
      <div class="file-info">
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="file-size">${fileSize}</div>
        <div class="progress-bar">
          <div class="progress" style="width: 0%"></div>
        </div>
        <div class="prediction-result"></div>
      </div>
      <button class="remove-btn" title="Remove">×</button>
    `;

    fileList.appendChild(fileItem);

    // Start the upload and prediction process
    uploadAndPredict(fileItem, file);

    // Add remove button handler
    const removeBtn = fileItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileItem.remove();
    });
  }

  async function uploadAndPredict(fileItem, file) {
    const progressBar = fileItem.querySelector('.progress');
    const resultElement = fileItem.querySelector('.prediction-result');
    
    try {
      // Reset progress bar
      progressBar.style.width = '0%';
      progressBar.style.backgroundColor = '#4CAF50';
      
      // Show processing message
      resultElement.innerHTML = '<div class="status">Uploading...</div>';
      
      // Call predictAudio with progress callback
      const result = await predictAudio(file, (progress) => {
        // Update progress bar in real-time
        progressBar.style.width = `${progress}%`;
        
        // Show processing message when upload is complete but still waiting for response
        if (progress === 100) {
          resultElement.innerHTML = '<div class="status">Processing audio...</div>';
        }
      });
      
      // Update UI with prediction result
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = '#0d652d';
      fileItem.classList.add('upload-complete');
      
      // Display the prediction result
      resultElement.innerHTML = `
        <div class="prediction">
          <strong>Prediction:</strong> ${result.label} 
          <span class="confidence">(${(result.confidence * 100).toFixed(1)}% confidence)</span>
        </div>
      `;
      
    } catch (error) {
      console.error('Error processing file:', error);
      progressBar.style.backgroundColor = '#d93025';
      progressBar.style.width = '100%';
      resultElement.innerHTML = `
        <div class="error">
          Error: ${error.message || 'Failed to process audio'}
        </div>
      `;
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Prevent drag and drop from opening files in the browser
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});
