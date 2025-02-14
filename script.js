document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subject');
    const monthSelect = document.getElementById('month');
    const yearSelect = document.getElementById('year');
    const dateInput = document.getElementById('date');
    const eventList = document.getElementById('events');
    const rememberMonthCheckbox = document.getElementById('remember-month');
    const addedEvents = [];

    // Populate dropdowns
    populateSubjects();
    populateMonths();
    populateYears();

    // Event listeners
    document.getElementById('add-subject').addEventListener('click', addNewSubject);
    document.getElementById('remove-subject').addEventListener('click', removeSubject);
    document.querySelectorAll('.num-btn').forEach(btn => {
        if (btn.id === 'day-btn') {
            btn.addEventListener('click', () => addEvent('12:00', '12:30'));
        } else if (btn.id === 'night-btn') {
            btn.addEventListener('click', () => addEvent('19:00', '19:30'));
        } else {
            btn.addEventListener('click', () => appendToDate(btn.textContent));
        }
    });
    document.getElementById('create-csv').addEventListener('click', createCSV);
    rememberMonthCheckbox.addEventListener('change', handleRememberMonth);
    monthSelect.addEventListener('change', handleMonthChange);

    function populateSubjects() {
        const caregivers = JSON.parse(localStorage.getItem('caregivers')) || ['Beth', 'Tara', 'Patricia', 'Stacey'];
        subjectSelect.innerHTML = '<option value="">Select a caregiver</option>';
        caregivers.forEach(caregiver => {
            const option = document.createElement('option');
            option.value = option.textContent = caregiver;
            subjectSelect.appendChild(option);
        });
    }

    function removeSubject() {
        const selectedCaregiver = subjectSelect.value;
        if (selectedCaregiver) {
            const caregivers = JSON.parse(localStorage.getItem('caregivers')) || [];
            const updatedCaregivers = caregivers.filter(caregiver => caregiver !== selectedCaregiver);
            localStorage.setItem('caregivers', JSON.stringify(updatedCaregivers));
            populateSubjects();
            alert(`Caregiver "${selectedCaregiver}" has been removed.`);
        } else {
            alert('Please select a caregiver to remove.');
        }
    }

    function populateMonths() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = (index + 1).toString().padStart(2, '0');
            option.textContent = month;
            monthSelect.appendChild(option);
        });
        
        // Set the saved month if available
        const savedMonth = localStorage.getItem('savedMonth');
        if (savedMonth) {
            monthSelect.value = savedMonth;
            rememberMonthCheckbox.checked = true;
        }
    }

    function handleRememberMonth() {
        if (rememberMonthCheckbox.checked) {
            localStorage.setItem('savedMonth', monthSelect.value);
        } else {
            localStorage.removeItem('savedMonth');
        }
    }

    function handleMonthChange() {
        if (rememberMonthCheckbox.checked) {
            localStorage.setItem('savedMonth', monthSelect.value);
        }
    }

    function populateYears() {
        for (let year = 2025; year <= 2035; year++) {
            const option = document.createElement('option');
            option.value = option.textContent = year;
            yearSelect.appendChild(option);
        }
        yearSelect.value = '2025'; // Set default year to 2025
    }

    function addNewSubject() {
        const newSubject = prompt('Enter a new subject:');
        if (newSubject && !Array.from(subjectSelect.options).some(option => option.value === newSubject)) {
            const option = document.createElement('option');
            option.value = option.textContent = newSubject;
            subjectSelect.appendChild(option);
            subjectSelect.value = newSubject;

            const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
            subjects.push(newSubject);
            localStorage.setItem('subjects', JSON.stringify(subjects));
        }
    }

    function appendToDate(num) {
        if (dateInput.value.length === 0 || (dateInput.value.length === 1 && dateInput.value !== '0')) {
            dateInput.value += num;
        }
    }

    function addEvent(startTime, endTime) {
        if (!validateInputs()) return;
    
        const subject = subjectSelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;
        const date = dateInput.value.padStart(2, '0');
        const startDateTime = `${year}-${month}-${date}T${startTime}`;
        const endDateTime = `${year}-${month}-${date}T${endTime}`;
    
        // Check for existing events at the same date and time
        const conflictingEvent = addedEvents.find(event =>
            event.startDateTime === startDateTime && event.endDateTime === endDateTime
        );
    
        if (conflictingEvent) {
            alert(`Cannot add event. There is already a "${conflictingEvent.subject}" event scheduled at this date and time.`);
            return;
        }
    
        const event = { subject, startDateTime, endDateTime };
        addedEvents.push(event);
        updateEventList();
        clearInputs();
    }

    function updateEventList() {
        eventList.innerHTML = '<h2>Added Events (Month/Day/Year)</h2>';
        addedEvents.forEach((event, index) => {
            const li = document.createElement('li');
            const startDate = new Date(event.startDateTime);
            const shiftType = getShiftType(startDate);
            li.innerHTML = `
                <div class="event-info">${event.subject} ${formatDate(startDate)} ${shiftType}</div>
                <div class="delete-btn-container">
                    <button type="button" class="delete-btn" data-index="${index}">🗑️</button>
                </div>
            `;
            eventList.appendChild(li);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteEvent(parseInt(e.target.dataset.index)));
        });
    }

    function deleteEvent(index) {
        addedEvents.splice(index, 1);
        updateEventList();
    }

    function validateInputs() {
        if (!subjectSelect.value) {
            alert('Please select a subject.');
            return false;
        }
        if (!monthSelect.value) {
            alert('Please select a month.');
            return false;
        }
        if (!yearSelect.value) {
            alert('Please select a year.');
            return false;
        }
        const dateValue = parseInt(dateInput.value, 10);
        if (isNaN(dateValue) || dateValue < 1 || dateValue > 31) {
            alert('Please enter a valid date (1-31).');
            return false;
        }
        return true;
    }

    function clearInputs() {
        dateInput.value = '';
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    function getShiftType(date) {
        const hours = date.getHours();
        if (hours >= 7 && hours < 19) {
            return 'day';
        } else {
            return 'night';
        }
    }

    function createCSV() {
        if (addedEvents.length === 0) {
            alert('Please add at least one event before creating a CSV.');
            return;
        }

        const sendReminders = document.getElementById('send-reminders').checked;

        const csvContent = [
            'Subject,Start Date,Start Time,End Date,End Time,Send Reminder',
            ...addedEvents.map(event => {
                const startDate = new Date(event.startDateTime);
                const endDate = new Date(event.endDateTime);
                const formatDate = (date) => date.toISOString().split('T')[0];
                const formatTime = (date) => date.toTimeString().split(' ')[0];
                return `${event.subject},${formatDate(startDate)},${formatTime(startDate)},${formatDate(endDate)},${formatTime(endDate)},${sendReminders}`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, 'calendar_events.csv');
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = 'calendar_events.csv';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Open Google Calendar export page in a new tab
        window.open('https://calendar.google.com/calendar/u/0/r/settings/export', '_blank');
    }
});
