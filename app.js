const STORAGE_KEY = 'crud-estudiantes';
const MIN_GRADE = 0;
const MAX_GRADE = 10;

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
const pacmanCanvas = document.getElementById('pacman-bg');

let students = loadStudents();
let idSequence = 0;
gradeInput.min = String(MIN_GRADE);
gradeInput.max = String(MAX_GRADE);

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
    let uuid = crypto.randomUUID();
    while (students.some((student) => student.id === uuid)) {
      uuid = crypto.randomUUID();
    }
    return uuid;
  }
  let fallbackId = '';
  do {
    idSequence += 1;
    fallbackId = `${Date.now()}-${idSequence}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  } while (students.some((student) => student.id === fallbackId));
  return fallbackId;
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
  if (Number.isNaN(gradeValue) || gradeValue < MIN_GRADE || gradeValue > MAX_GRADE) {
    return `El promedio debe estar entre ${MIN_GRADE} y ${MAX_GRADE}.`;
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
    const existingIndex = students.findIndex((student) => student.id === data.id);
    if (existingIndex === -1) {
      showMessage('No se encontró el estudiante a actualizar.', true);
      resetForm();
      return;
    }
    students[existingIndex] = data;
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
    const confirmed = window.confirm(`¿Eliminar a ${String(student.name)}?`);
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

function setupPacmanBackground() {
  if (!pacmanCanvas) {
    return;
  }

  const context = pacmanCanvas.getContext('2d');
  if (!context) {
    return;
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cellSize = 32;
  let width = 0;
  let height = 0;
  let animationFrameId = 0;
  let x = 0;
  let direction = 1;
  let mouthOpen = true;
  let frameCount = 0;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    pacmanCanvas.width = width;
    pacmanCanvas.height = height;
  }

  function drawMaze() {
    context.strokeStyle = 'rgba(30, 58, 138, 0.3)';
    context.lineWidth = 2;
    for (let y = cellSize; y < height; y += cellSize * 2) {
      for (let startX = 0; startX < width; startX += cellSize * 4) {
        context.beginPath();
        context.moveTo(startX, y);
        context.lineTo(startX + cellSize * 2, y);
        context.stroke();
      }
    }
  }

  function drawDots(laneY) {
    context.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let dotX = 10; dotX < width; dotX += 26) {
      context.beginPath();
      context.arc(dotX, laneY, 2.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawPacman(centerX, centerY) {
    const mouth = mouthOpen ? 0.32 : 0.12;
    const start = direction === 1 ? mouth : Math.PI + mouth;
    const end = direction === 1 ? Math.PI * 2 - mouth : Math.PI - mouth;
    context.fillStyle = '#facc15';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, 16, start, end, false);
    context.closePath();
    context.fill();
  }

  function drawGhost(centerX, centerY) {
    context.fillStyle = 'rgba(236, 72, 153, 0.85)';
    context.beginPath();
    context.arc(centerX, centerY, 14, Math.PI, 0);
    context.lineTo(centerX + 14, centerY + 10);
    context.lineTo(centerX + 7, centerY + 6);
    context.lineTo(centerX, centerY + 10);
    context.lineTo(centerX - 7, centerY + 6);
    context.lineTo(centerX - 14, centerY + 10);
    context.closePath();
    context.fill();
  }

  function animate() {
    if (width === 0 || height === 0) {
      return;
    }

    context.clearRect(0, 0, width, height);
    drawMaze();

    const laneY = Math.max(120, height * 0.25);
    drawDots(laneY);

    x += direction * 2;
    if (x > width + 30) {
      x = width + 30;
      direction = -1;
    } else if (x < -30) {
      x = -30;
      direction = 1;
    }

    frameCount += 1;
    if (frameCount % 6 === 0) {
      mouthOpen = !mouthOpen;
    }
    drawPacman(x, laneY);
    drawGhost(x - direction * 80, laneY);

    animationFrameId = window.requestAnimationFrame(animate);
  }

  resizeCanvas();
  if (width === 0 || height === 0) {
    return;
  }
  window.addEventListener('resize', resizeCanvas);

  if (!reducedMotionQuery.matches) {
    animate();
  } else {
    context.clearRect(0, 0, width, height);
    drawMaze();
  }

  reducedMotionQuery.addEventListener('change', () => {
    if (reducedMotionQuery.matches) {
      window.cancelAnimationFrame(animationFrameId);
      context.clearRect(0, 0, width, height);
      drawMaze();
      return;
    }
    animate();
  });
}

setupPacmanBackground();
renderStudents();
