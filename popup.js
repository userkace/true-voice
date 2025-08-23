document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('audio-upload');
  const uploadContainer = document.querySelector('.upload-container');
  const fileList = document.getElementById('file-list');

  // Handle file selection
  fileInput.addEventListener('change', handleFileSelect);

  // Handle click on upload container
  uploadContainer.addEventListener('click', () => {
    fileInput.click();
  });

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

    // Insert new items at the top of the list
    if (fileList.firstChild) {
      fileList.insertBefore(fileItem, fileList.firstChild);
    } else {
      fileList.appendChild(fileItem);
    }

    // Start the upload and prediction process
    uploadAndPredict(fileItem, file);

    // Add remove button handler
    const removeBtn = fileItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Add removing class to trigger the animation
      fileItem.classList.add('removing');
      // Remove the element after animation completes
      setTimeout(() => {
        fileItem.remove();
      }, 300); // Match this with the CSS animation duration
    });
  }

  // Array of fun status messages for upload phase
  const uploadMessages = [
    'Sending audio to our AI detectives...',
    'Beaming up your audio to the cloud...',
    'Warming up the audio analysis engines...',
    'Preparing to work our magic...',
    'Getting the audio analysis party started...',
    'Our AI is putting on its thinking cap...',
    'Initializing sonic pattern detection...'
  ];

  // Array of fun status messages for processing phase
  const processingMessages = [
    'Our AI is listening carefully...',
    'Analyzing audio fingerprints...',
    'Decoding the sonic secrets...',
    'Consulting the audio oracle...',
    'Running complex audio algorithms...',
    'The AI is deep in thought...',
    'Almost there, just a few more calculations...'
  ];

  function getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  async function uploadAndPredict(fileItem, file) {
    const progressBar = fileItem.querySelector('.progress');
    const resultElement = fileItem.querySelector('.prediction-result');
    let uploadInterval;
    let hasPrediction = false; // Track if we've received a prediction

    try {
      // Reset progress bar
      const progressBarContainer = fileItem.querySelector('.progress-bar');
      if (progressBarContainer) {
        progressBarContainer.style.display = 'block';
      }
      progressBar.style.width = '0%';
      progressBar.style.backgroundColor = '#4CAF50';

      // Show initial upload message
      const updateStatus = (message) => {
        if (!hasPrediction && !resultElement.querySelector('.error')) {
          clearInterval(uploadInterval);
          resultElement.innerHTML = `<div class="status">${message}</div>`;
        }
      };

      updateStatus(getRandomMessage(uploadMessages));

      // Update message every 3 seconds during upload
      uploadInterval = setInterval(() => {
        if (progressBar.style.width !== '100%' && !resultElement.querySelector('.error')) {
          updateStatus(getRandomMessage(uploadMessages));
        } else {
          clearInterval(uploadInterval);
        }
      }, 3000);

      // Call predictAudio with progress callback
      const result = await predictAudio(file, (progress) => {
        // Update progress bar in real-time
        progressBar.style.width = `${progress}%`;

        // Switch to processing messages when upload is complete
        if (progress === 100 && !hasPrediction) {
          clearInterval(uploadInterval);
          // Update processing message every 3 seconds
          const processInterval = setInterval(() => {
            if (!hasPrediction && !resultElement.querySelector('.error')) {
              resultElement.innerHTML = `<div class="status">${getRandomMessage(processingMessages)}</div>`;
            } else {
              clearInterval(processInterval);
            }
          }, 3000);
          // Store interval ID to clear it later
          fileItem.processInterval = processInterval;
        }
      });

      // Clear the interval when upload is complete
      if (uploadInterval) clearInterval(uploadInterval);
      if (fileItem.processInterval) {
        clearInterval(fileItem.processInterval);
      }

      // Update UI with prediction result and hide progress bar
      progressBar.style.width = '100%';
      progressBar.style.backgroundColor = '#0d652d';
      fileItem.classList.add('upload-complete');

      // Hide progress bar container after prediction
      if (progressBar && progressBar.parentElement) {
        progressBar.parentElement.style.display = 'none';
      }

      // Determine color based on prediction
      const isReal = result.label.toLowerCase() === 'real';
      const confidenceColor = isReal ? '#23d2fe' : '#ff6b6b'; // real : fake


      // Display the prediction result with confidence pill
      hasPrediction = true;
      const confidencePercent = (result.confidence * 100).toFixed(1);
      const displayLabel = result.label.charAt(0).toUpperCase() + result.label.slice(1).toLowerCase();
      resultElement.innerHTML = `
        <div class="prediction confidence-pill">${displayLabel}</div>
        <div class="confidence-pill" style="color: ${confidenceColor};">${confidencePercent}%</div>
      `;

    } catch (error) {
      console.error('Error processing file:', error);
      // Hide progress bar container and clear any intervals on error
      const progressBarContainer = fileItem.querySelector('.progress-bar');
      if (progressBarContainer) {
        progressBarContainer.style.display = 'none';
      }
      if (fileItem.processInterval) {
        clearInterval(fileItem.processInterval);
      }
      resultElement.innerHTML = `
        <div class="error">
          Oops! Our AI got a bit confused.\n${['Try again?', 'Maybe another file?', 'Let\'s give it another shot!'][Math.floor(Math.random() * 3)]}
          <div class="error-detail">${error.message || 'Failed to process audio'}</div>
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