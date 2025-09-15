// Use browser API namespace that works in both Chrome and Firefox
const browser = window.browser || window.chrome;

// Function to show styled error messages
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;

  // Style the error message
  errorDiv.style.cssText = `
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
    font-weight: 500;
    padding: 10px 15px;
    border-radius: 8px;
    margin: 10px 0;
    border-left: 3px solid #ff6b6b;
    animation: fadeIn 0.3s ease-in-out;
  `;

  // Add to the top of the container
  const container = document.querySelector('.container');
  if (container.firstChild) {
    container.insertBefore(errorDiv, container.firstChild);
  } else {
    container.appendChild(errorDiv);
  }

  // Remove after 5 seconds with fade out animation
  setTimeout(() => {
    errorDiv.style.animation = 'fadeOut 0.3s ease-in-out forwards';
    setTimeout(() => errorDiv.remove(), 300);
  }, 5000);
}

// Format file size to human readable format
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to save file list to storage
async function saveFileList() {
  try {
    const fileList = document.getElementById('file-list');
    if (!fileList) {
      console.error('File list element not found');
      return;
    }

    const files = [];

    // Get all file items and their data
    fileList.querySelectorAll('.file-item').forEach(item => {
      const fileName = item.dataset.fileName;
      const resultElement = item.querySelector('.prediction-result');
      const resultHtml = resultElement ? resultElement.innerHTML : '';

      // Get the file size from the UI if available
      const sizeElement = item.querySelector('.file-size');
      const fileSize = sizeElement ? sizeElement.textContent : '0 Bytes';
      
      // Get segments data if available
      const segmentsList = item.querySelector('.segments-list');
      const segments = [];
      if (segmentsList) {
        segmentsList.querySelectorAll('.segment-item').forEach(segmentItem => {
          const labelEl = segmentItem.querySelector('.segment-label');
          const confidenceEl = segmentItem.querySelector('.segment-confidence');
          
          if (labelEl && confidenceEl) {
            segments.push({
              label: labelEl.textContent,
              confidence: confidenceEl.textContent.trim()
            });
          }
        });
      }
      
      // Save the file data
      files.push({
        fileName,
        resultHtml: resultElement ? resultElement.innerHTML : '',
        expanded: item.classList.contains('expanded'),
        fileSize: fileSize,
        segments: segments
      });
      
      console.log('Saving file:', files[files.length - 1]);
    });

    console.log('Saving files to storage:', files);
    await chrome.storage.local.set({ savedFiles: files });
    console.log('Files saved successfully');

    // Verify the save was successful
    const verify = await chrome.storage.local.get('savedFiles');
    console.log('Verify saved data:', verify);

  } catch (error) {
    console.error('Error saving file list:', error);
    throw error; // Re-throw to handle in the calling function
  }
}

// Function to load file list from storage
async function loadFileList() {
  try {
    const fileList = document.getElementById('file-list');
    if (!fileList) {
      console.error('File list element not found');
      return;
    }

    console.log('Loading files from storage...');
    const result = await chrome.storage.local.get('savedFiles');
    console.log('Loaded from storage:', result);

    if (result.savedFiles && result.savedFiles.length > 0) {
      // Clear existing items
      fileList.innerHTML = '';

      // Add each saved file
      for (const file of result.savedFiles) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.dataset.fileName = file.fileName;

      // Create the file item structure
      // For loaded files, use the saved result HTML, file size, and segments
      const fileSize = file.fileSize || '0 Bytes';
      fileItem.innerHTML = `
        <div class="file-header">
          <div class="file-info">
            <div class="file-name" title="${file.fileName}">${file.fileName}</div>
            <div class="file-size">${fileSize}</div>
            <div class="prediction-result">${file.resultHtml}</div>
            <div class="progress-bar" style="display: none;">
              <div class="progress" style="width: 100%"></div>
            </div>
          </div>
          <button class="remove-btn" title="Remove">×</button>
        </div>
        <div class="accordion-content">
          <div class="segments-list"></div>
        </div>
      `;

      // Add to the list
      fileList.appendChild(fileItem);
      
      // Restore segments if they exist
      const segmentsList = fileItem.querySelector('.segments-list');
      if (file.segments && file.segments.length > 0) {
        file.segments.forEach(segment => {
          const segmentItem = document.createElement('div');
          segmentItem.className = 'segment-item';
          segmentItem.innerHTML = `
            <div class="segment-header">
              <div class="segment-info">
                <div class="segment-label">${segment.label}</div>
              </div>
              <div class="segment-confidence">${segment.confidence}</div>
            </div>
          `;
          segmentsList.appendChild(segmentItem);
        });
      }
      
      // Restore expanded state if needed
      if (file.expanded) {
        fileItem.classList.add('expanded');
        const accordionContent = fileItem.querySelector('.accordion-content');
        if (accordionContent) {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        }
      }

      // Add remove button handler
      const removeBtn = fileItem.querySelector('.remove-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileItem.classList.add('removing');
          setTimeout(() => {
            fileItem.remove();
            updateClearAllButton();
            saveFileList(); // Save after removal
          }, 300);
        });
      }

      // Add accordion toggle
      const accordionHeader = fileItem.querySelector('.accordion-header');
      if (accordionHeader) {
        accordionHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = accordionHeader.dataset.expanded === 'true';
          accordionHeader.dataset.expanded = !isExpanded;

          if (!isExpanded) {
            const accordionContent = fileItem.querySelector('.accordion-content');
            if (accordionContent) {
              accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
            }
            fileItem.classList.add('expanded');
          } else {
            const accordionContent = fileItem.querySelector('.accordion-content');
            if (accordionContent) {
              accordionContent.style.maxHeight = '0';
            }
            fileItem.classList.remove('expanded');
          }

          // Save the expanded state
          saveFileList();
        });
      }
    }

      // Update clear all button
      updateClearAllButton();
    }
  } catch (error) {
    console.error('Error loading file list:', error);
  }
}

// Function to update the clear all button visibility
function updateClearAllButton() {
  const fileList = document.getElementById('file-list');
  const clearAllContainer = document.getElementById('clear-all-container');

  if (fileList.children.length >= 3) {
    clearAllContainer.style.display = 'block';
  } else {
    clearAllContainer.style.display = 'none';
  }
}

// Function to clear all files
async function clearAllFiles() {
  const fileList = document.getElementById('file-list');
  const fileItems = fileList.querySelectorAll('.file-item');

  // Add removing class to all file items
  fileItems.forEach(item => {
    item.classList.add('removing');
  });

  // Remove all file items after animation completes
  return new Promise(resolve => {
    setTimeout(() => {
      fileList.innerHTML = '';
      updateClearAllButton();
      resolve();
    }, 300); // Match this with the CSS animation duration
  });
}

// Test storage functionality
async function testStorage() {
  try {
    // Test write
    const testData = { test: 'test', timestamp: Date.now() };
    await chrome.storage.local.set({ test: testData });

    // Test read
    const result = await chrome.storage.local.get('test');
    console.log('Storage test - Read back:', result);

    if (result.test && result.test.timestamp === testData.timestamp) {
      console.log('Storage test passed!');
      return true;
    } else {
      console.error('Storage test failed - data mismatch');
      return false;
    }
  } catch (error) {
    console.error('Storage test failed:', error);
    return false;
  }
}

// Save the file list when the popup is about to close
window.addEventListener('beforeunload', async (event) => {
  try {
    console.log('Popup closing, saving file list...');
    await saveFileList();
  } catch (error) {
    console.error('Error saving file list before unload:', error);
  }
  // Note: We don't prevent the unload event
});

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, testing storage...');
  try {
    const storageWorking = await testStorage();
    if (!storageWorking) {
      showError('Warning: Browser storage might not be working correctly');
    }

    console.log('Loading saved files...');
    await loadFileList();
    console.log('Initial file load complete');
  } catch (error) {
    console.error('Error loading saved files:', error);
    showError('Error loading saved files: ' + error.message);
  }
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
  uploadContainer.addEventListener('drop', async (e) => {
    await handleDrop(e);
  }, false);

  // Add clear all button handler
  const clearAllBtn = document.getElementById('clear-all-btn');
  clearAllBtn.addEventListener('click', async () => {
    try {
      await clearAllFiles();
      await saveFileList();
      // Clear storage completely
      await chrome.storage.local.clear();
      console.log('Storage cleared');
    } catch (error) {
      console.error('Error clearing files:', error);
    }
  });

  async function handleDrop(e) {
    preventDefaults(e);
    unhighlight();
    const dt = e.dataTransfer;
    const files = dt.files;

    // Check if any files were dropped
    if (!files || files.length === 0) {
      return;
    }

    // Filter audio files
    const audioFiles = Array.from(files).filter(file =>
      file.type && file.type.startsWith('audio/')
    );

    // Show error if no audio files found
    if (audioFiles.length === 0) {
      showError('This extension only accepts audio files.');
      return;
    }

    handleFiles(files);
  }

  async function handleFileSelect(e) {
    const files = e.target.files;

    // Check if any files were selected
    if (!files || files.length === 0) {
      return;
    }

    // Filter audio files
    const audioFiles = Array.from(files).filter(file =>
      file.type && file.type.startsWith('audio/')
    );

    // Show error if no audio files found
    if (audioFiles.length === 0) {
      showError('This extension only accepts audio files.');
      return;
    }

    handleFiles(files);

    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }

  async function handleFiles(files) {
    // Convert FileList to array and filter audio files
    const fileArray = Array.from(files).filter(file => {
      // Some browsers might not have type set, so we'll accept those too
      return !file.type || file.type.startsWith('audio/');
    });

    if (fileArray.length === 0) {
      // Show error if no audio files were found
      showError('This extension only accepts audio files.');
      return;
    }

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB in bytes
    fileArray.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        showError(`File "${file.name}" exceeds the 30MB size limit and will not be uploaded.`);
        return;
      }
      addFileToList(file);
    });
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileName = file.name;

    const fileSize = formatFileSize(file.size);

    fileItem.innerHTML = `
      <div class="file-header">
        <div class="file-info">
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-size">${fileSize}</div>
          <div class="progress-bar">
            <div class="progress" style="width: 0%"></div>
          </div>
          <div class="prediction-result"></div>
        </div>
        <button class="remove-btn" title="Remove">×</button>
      </div>
      <div class="accordion-content">
        <div class="segments-list"></div>
      </div>
    `;

    // Insert new items at the top of the list
    if (fileList.firstChild) {
      fileList.insertBefore(fileItem, fileList.firstChild);
    } else {
      fileList.appendChild(fileItem);
    }

    // Update clear all button visibility
    updateClearAllButton();

    // Save the updated file list
    await saveFileList();

    // Start the upload and prediction process
    await uploadAndPredict(fileItem, file);

    // Add remove button handler
    const removeBtn = fileItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Add removing class to trigger the animation
      fileItem.classList.add('removing');
      // Remove the element after animation completes
      await new Promise(resolve => setTimeout(resolve, 300));
      fileItem.remove();
      updateClearAllButton();
      await saveFileList().catch(console.error);
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

  async function createAccordionResult(fileItem, result) {
    const fileHeader = fileItem.querySelector('.file-header');
    const accordionContent = fileItem.querySelector('.accordion-content');
    const segmentsList = fileItem.querySelector('.segments-list');
    const resultElement = fileItem.querySelector('.prediction-result');

    // Determine color based on prediction and confidence
    const isReal = result.label.toLowerCase() === 'real';
    const confidencePercent = (result.confidence * 100).toFixed(1);
    let confidenceColor;
    if (confidencePercent < 80) {
      confidenceColor = '#FFD700'; // yellow for low confidence
    } else {
      confidenceColor = isReal ? '#23d2fe' : '#ff6b6b'; // real : fake
    }
    const displayLabel = result.label.charAt(0).toUpperCase() + result.label.slice(1).toLowerCase();

    // Create the main result display
    resultElement.innerHTML = `
      <div class="accordion-header" data-expanded="false">
        <div class="main-result">
          <div class="prediction confidence-pill">${displayLabel}</div>
          <div class="confidence-pill" style="color: ${confidenceColor};">${confidencePercent}%</div>
        </div>
        <div class="accordion-toggle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="chevron-icon">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>
    `;

    // Create segments display
    if (result.segments && result.segments.length > 0) {
      result.segments.forEach((segment, index) => {
        const segmentIsReal = segment.label.toLowerCase() === 'real';
        const segmentConfidencePercent = (segment.probabilities[segment.label] * 100).toFixed(1);
        let segmentConfidenceColor;
        if (segmentConfidencePercent < 80) {
          segmentConfidenceColor = '#FFD700'; // yellow for low confidence
        } else {
          segmentConfidenceColor = segmentIsReal ? '#23d2fe' : '#ff6b6b'; // real : fake
        }
        const segmentDisplayLabel = segment.label.charAt(0).toUpperCase() + segment.label.slice(1).toLowerCase();

        const segmentItem = document.createElement('div');
        segmentItem.className = 'segment-item';
        segmentItem.innerHTML = `
          <div class="segment-header">
            <div class="segment-info">
              <div class="segment-label">${segmentDisplayLabel}</div>
            </div>
            <div class="segment-confidence" style="color: ${segmentConfidenceColor};">
              ${segmentConfidencePercent}%
            </div>
          </div>
        `;

        segmentsList.appendChild(segmentItem);
      });
    }

    // Add accordion toggle functionality
    const accordionHeader = fileItem.querySelector('.accordion-header');
    accordionHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = accordionHeader.dataset.expanded === 'true';
      accordionHeader.dataset.expanded = !isExpanded;

      if (!isExpanded) {
        accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
        fileItem.classList.add('expanded');
      } else {
        accordionContent.style.maxHeight = '0';
        fileItem.classList.remove('expanded');
      }
    });
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

      // Create accordion result display and save the file list when done
      hasPrediction = true;
      await createAccordionResult(fileItem, result);
      await saveFileList(); // Save after prediction is complete

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