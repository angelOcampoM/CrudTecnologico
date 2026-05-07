const STORAGE_KEY = 'crud-estudiantes';

const studentForm = document.getElementById('student-form');
const studentIdInput = document.getElementById('student-id');
const nameInput = document.getElementById('name');
const enrollmentInput = document.getElementById('enrollment');
const emailInput = document.getElementById('email');
const courseInput = document.getElementById('course');
const gradeInput = document.getElementById('grade');
const message = document.getElementById('message');
const studentList = document.getElementById('student-list');
const total = document.getElementById('total');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');

let students = loadStudents();
let idSequence = 0;

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function resetForm() {
  studentForm.reset();
  studentIdInput.value = '';
  cancelBtn.hidden = true;
  formTitle.textContent = 'Registrar estudiante';
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#dc2626' : '#065f46';
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  idSequence += 1;
  return `${Date.now()}-${idSequence}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function renderStudents() {
  total.textContent = `Total: ${students.length}`;

  if (students.length === 0) {
    studentList.innerHTML = '<tr><td class="empty" colspan="6">Sin registros</td></tr>';
    return;
  }

  const fragment = document.createDocumentFragment();

  students.forEach((student) => {
    const row = document.createElement('tr');
    const values = [student.name, student.enrollment, student.email, student.course, student.grade];
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.appendChild(cell);
    });

    const actionsCell = document.createElement('td');
    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'row-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit';
    editButton.dataset.id = student.id;
    editButton.textContent = 'Editar';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'warn';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.id = student.id;
    deleteButton.textContent = 'Eliminar';

    actionsWrapper.append(editButton, deleteButton);
    actionsCell.appendChild(actionsWrapper);
    row.appendChild(actionsCell);
    fragment.appendChild(row);
  });

  studentList.innerHTML = '';
  studentList.appendChild(fragment);
}

function validateForm(data) {
  if (!data.name || !data.enrollment || !data.email || !data.course || !data.grade) {
    return 'Todos los campos son obligatorios.';
  }

  if (!emailInput.checkValidity()) {
    return 'Ingresa un correo válido.';
  }

  const gradeValue = Number(data.grade);
  if (Number.isNaN(gradeValue) || gradeValue < 0 || gradeValue > 10) {
    return 'El promedio debe estar entre 0 y 10.';
  }

  return null;
}

studentForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = {
    id: studentIdInput.value || generateId(),
    name: nameInput.value.trim(),
    enrollment: enrollmentInput.value.trim(),
    email: emailInput.value.trim(),
    course: courseInput.value.trim(),
    grade: gradeInput.value.trim(),
  };

  const error = validateForm(data);
  if (error) {
    showMessage(error, true);
    return;
  }

  if (studentIdInput.value) {
    students = students.map((student) => (student.id === data.id ? data : student));
    showMessage('Estudiante actualizado correctamente.');
  } else {
    students.push(data);
    showMessage('Estudiante registrado correctamente.');
  }

  saveStudents();
  renderStudents();
  resetForm();
});

studentList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const { action, id } = button.dataset;
  const student = students.find((item) => item.id === id);
  if (!student) {
    return;
  }

  if (action === 'edit') {
    studentIdInput.value = student.id;
    nameInput.value = student.name;
    enrollmentInput.value = student.enrollment;
    emailInput.value = student.email;
    courseInput.value = student.course;
    gradeInput.value = student.grade;
    cancelBtn.hidden = false;
    formTitle.textContent = 'Editar estudiante';
    showMessage('Modo edición activo.');
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`¿Eliminar a ${student.name}?`);
    if (!confirmed) {
      return;
    }

    students = students.filter((item) => item.id !== id);
    saveStudents();
    renderStudents();
    resetForm();
    showMessage('Estudiante eliminado correctamente.');
  }
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showMessage('Edición cancelada.');
});

renderStudents();
