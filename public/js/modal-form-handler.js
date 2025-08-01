document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('show.bs.modal', event => {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const dataset = trigger.dataset;

      Object.keys(dataset).forEach(key => {
        const input = modal.querySelector(`#${modal.id}-${key}`);
        if (input) input.value = dataset[key];
      });
    });
  });

  async function reloadUserData(page = 1, limit = 1) {
    const res = await fetch(`/users/json?page=${page}&limit=${limit}`);
    const data = await res.json();

    const users = data.users;
    const t = data.t || {};
    const tableBody = document.querySelector('#userTableBody');
    const paginationWrapper = document.querySelector('#paginationWrapper');

    tableBody.innerHTML = ''; // Clear old rows

    users.forEach((user, index) => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td class="text-center align-middle">${(data.currentPage - 1) * data.limit + index + 1}</td>
        <td class="align-middle">${user.name}</td>
        <td class="align-middle">${user.email}</td>
        <td class="align-middle">${user.phone}</td>
        <td class="text-center align-middle">
          <img class="rounded-circle" width="50px" src="${user.avatar}" alt="">
        </td>
        <td class="align-middle">${user.description || ''}</td>
        <td class="text-center align-middle">${user.role?.name || ''}</td>
        <td class="text-center align-middle">${user.plan?.name || ''}</td>
        <td class="text-center align-middle">
          <button class="btn btn-${user.status === 1 ? 'success' : 'warning'}">
            ${user.status === 1 ? t.active : t.close}
          </button>
        </td>
        <td class="text-center align-middle text-nowrap">
          <button class="btn btn-info"
            data-bs-toggle="modal" data-bs-target="#edit"
            data-id="${user.id}"
            data-name="${user.name}"
            data-email="${user.email}"
            data-phone="${user.phone}"
            data-avatar="${user.avatar}"
            data-description="${user.description}"
            data-role_id="${user.role_id}"
            data-plan_id="${user.plan_id}"
            data-status="${user.status}">
            ${t.update}
          </button>
          <button class="btn btn-danger"
            data-bs-toggle="modal" data-bs-target="#deleteModal"
            data-id="${user.id}">
            ${t.delete}
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Update pagination
    paginationWrapper.innerHTML = '';

    const totalPages = data.totalPages;
    const currentPage = data.currentPage;

    // Helper: create pagination button
    function createPageItem(page, isActive = false, label = null) {
      const li = document.createElement('li');
      li.className = `page-item ${isActive ? 'active' : ''}`;

      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = label || page;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        reloadUserData(page, data.limit);
      });

      li.appendChild(a);
      return li;
    }

    // Previous
    if (currentPage > 1) {
      paginationWrapper.appendChild(createPageItem(currentPage - 1, false, '«'));
    }

    // Always show page 1
    paginationWrapper.appendChild(createPageItem(1, currentPage === 1));

    if (currentPage > 3) {
      const li = document.createElement('li');
      li.className = 'page-item disabled';
      li.innerHTML = '<span class="page-link">...</span>';
      paginationWrapper.appendChild(li);
    }

    // Previous page
    if (currentPage - 1 > 1) {
      paginationWrapper.appendChild(createPageItem(currentPage - 1));
    }

    // Current page
    if (currentPage !== 1 && currentPage !== totalPages) {
      paginationWrapper.appendChild(createPageItem(currentPage, true));
    }

    // The next page follows
    if (currentPage + 1 < totalPages) {
      paginationWrapper.appendChild(createPageItem(currentPage + 1));
    }

    // If you need to insert a "..." between the next adjacent page and the last page
    if (currentPage < totalPages - 2) {
      const li = document.createElement('li');
      li.className = 'page-item disabled';
      li.innerHTML = '<span class="page-link">...</span>';
      paginationWrapper.appendChild(li);
    }

    // Always show last page
    if (totalPages > 1) {
      paginationWrapper.appendChild(createPageItem(totalPages, currentPage === totalPages));
    }

    // Next
    if (currentPage < totalPages) {
      paginationWrapper.appendChild(createPageItem(currentPage + 1, false, '»'));
    }
  }

  reloadUserData();

  document.querySelectorAll('.modal-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      let url = form.dataset.url;
      const method = form.dataset.method || 'POST';

      if (method === 'PUT' && data.id) {
        url += `/${data.id}`;
      }

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok) {
          toastr.success(result.message || 'Thành công');
          const modalElement = form.closest('.modal');
          if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement) 
                              || bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();
            if (modalElement.id === 'add') form.reset();
          }

          await reloadUserData(currentPage);
        } else {
          toastr.error(result.message || 'Đã có lỗi xảy ra');
        }
      } catch (err) {
        toastr.error('Lỗi máy chủ');
        console.error(err);
      }
    });
  });

  // Handle open delete modal
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.addEventListener('show.bs.modal', event => {
      const trigger = event.relatedTarget;
      if (!trigger) return;

      const id = trigger.dataset.id;
      const form = deleteModal.querySelector('.modal-form');
      if (form && id) {
        form.dataset.url = `/users/${id}`;
      }
    });
  }
});
