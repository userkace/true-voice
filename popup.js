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
      </div>
      <button class="remove-btn" title="Remove">×</button>
    `;

    fileList.appendChild(fileItem);

    // Simulate upload progress (in a real app, this would be an actual upload)
    simulateUploadProgress(fileItem, file);

    // Add remove button handler
    const removeBtn = fileItem.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileItem.remove();
    });
  }

  function simulateUploadProgress(fileItem, file) {
    const progressBar = fileItem.querySelector('.progress');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        fileItem.classList.add('upload-complete');
      }
      progressBar.style.width = `${progress}%`;
    }, 200);
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
