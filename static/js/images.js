// Image management functions
async function loadImages() {
    try {
        return await apiCall('/images');
    } catch (error) {
        showToast('Error loading images', 'error');
        return [];
    }
}

function renderImages(images) {
    const imageList = document.getElementById('image-list');
    if (!imageList) return;

    imageList.innerHTML = '';

    if (images.length === 0) {
        imageList.innerHTML = '<p class="text-gray-500 text-center py-8">No images found</p>';
        return;
    }

    images.forEach(image => {
        const imageEl = document.createElement('div');
        imageEl.className = 'bg-white p-4 rounded-lg shadow border border-gray-200';
        imageEl.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold">${image.tags[0] || 'No tag'}</h3>
                    <p class="text-sm text-gray-600">${image.id}</p>
                    <p class="text-sm text-gray-600">${image.size} MB</p>
                </div>
                <button class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600" onclick="deleteImage('${image.id}')">Delete</button>
            </div>
        `;
        imageList.appendChild(imageEl);
    });
}

async function deleteImage(id) {
    if (!confirm(`Are you sure you want to delete image ${id}?`)) return;

    try {
        await apiCall(`/images/${id}`, { method: 'DELETE' });
        showToast(`Image ${id} deleted`, 'success');
        notifyRefresh();
    } catch (error) {
        showToast(`Failed to delete image: ${error.message}`, 'error');
    }
}
