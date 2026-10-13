import React, { useState, useEffect, useRef } from 'react';
import './StudentManager.css';

const StudentManager = () => {
  const fileInputRef = useRef(null);

  // Courses List State
  const [courses, setCourses] = useState(() => {
    const savedCourses = localStorage.getItem('courses_list');
    return savedCourses ? JSON.parse(savedCourses) : ['BCA', 'MCA', 'B.Tech', 'BSc CS', 'BBA', 'MBA'];
  });

  // Modal & Course States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  // Students Data State
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('students_data');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Rahul Sharma', rollNo: '101', course: 'BCA', semester: '4th', email: 'rahul@gmail.com', cgpa: '8.5', status: 'Present', photo: '' },
      { id: 2, name: 'Priya Verma', rollNo: '102', course: 'B.Tech', semester: '6th', email: 'priya@gmail.com', cgpa: '9.1', status: 'Absent', photo: '' }
    ];
  });

  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const itemsPerPage = 5;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    course: 'BCA',
    semester: '1st',
    email: '',
    cgpa: '',
    status: 'Present',
    photo: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Search, Filter & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [sortKey, setSortKey] = useState('rollNo');
  const [sortDirection, setSortDirection] = useState('asc');

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem('students_data', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('courses_list', JSON.stringify(courses));
  }, [courses]);

  // Input Change Handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Compressed Photo Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 150;
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, photo: compressedBase64 }));
        };
      };
    }
  };

  // Add Course Handler
  const handleAddNewCourse = (e) => {
    e.preventDefault();
    const formattedCourse = newCourseName.trim();
    if (!formattedCourse) return;

    if (courses.some(c => (c || '').toLowerCase() === formattedCourse.toLowerCase())) {
      alert('❌ Ye course pehle se list mein maujood hai!');
      return;
    }

    setCourses([...courses, formattedCourse]);
    setFormData({ ...formData, course: formattedCourse });
    setNewCourseName('');
    setShowCourseModal(false);
  };

  // Submit Student Form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo || !formData.email) {
      alert('Kripya saari zaruri details bharein!');
      return;
    }

    if (!isEditing) {
      const isDuplicate = students.some(
        s => (s.rollNo || '').toLowerCase().trim() === (formData.rollNo || '').toLowerCase().trim()
      );
      if (isDuplicate) {
        alert(`❌ Roll Number "${formData.rollNo}" pehle se exist karta hai!`);
        return;
      }
    }

    if (isEditing) {
      setStudents(students.map(s => s.id === currentId ? { ...formData, id: currentId } : s));
      setIsEditing(false);
      setCurrentId(null);
    } else {
      const newStudent = { ...formData, id: Date.now() };
      setStudents([...students, newStudent]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rollNo: '',
      course: courses[0] || 'BCA',
      semester: '1st',
      email: '',
      cgpa: '',
      status: 'Present',
      photo: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
    setCurrentId(student.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Kya aap is student record ko delete karna chahte hain?')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const toggleAttendance = (id) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' };
      }
      return s;
    }));
  };

  // Export CSV
  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      alert('Export karne ke liye koi data nahi hai!');
      return;
    }
    const headers = ['Roll No,Name,Email,Course,Semester,CGPA,Status\n'];
    const rows = filteredStudents.map(s =>
      `"${s.rollNo || ''}","${s.name || ''}","${s.email || ''}","${s.course || ''}","${s.semester || ''}","${s.cgpa || 'N/A'}","${s.status || ''}"`
    );
    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Student_Records_${Date.now()}.csv`);
    a.click();
  };

  // Safe Filtering Logic
  let filteredStudents = students.filter(student => {
    const sName = (student.name || '').toLowerCase();
    const sRoll = (student.rollNo || '').toLowerCase();
    const sEmail = (student.email || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();

    const matchesSearch = sName.includes(search) || sRoll.includes(search) || sEmail.includes(search);
    const matchesCourse = courseFilter === 'All' || student.course === courseFilter;
    const matchesSemester = semesterFilter === 'All' || student.semester === semesterFilter;

    return matchesSearch && matchesCourse && matchesSemester;
  });

  // Safe Sorting Logic
  filteredStudents.sort((a, b) => {
    let valA = (a[sortKey] || '').toString().toLowerCase();
    let valB = (b[sortKey] || '').toString().toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const totalCount = students.length;
  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;

  return (
    <div className={`sms-container ${darkMode ? 'dark-theme' : ''}`}>
      {/* Top Header */}
      <div className="top-header">
        <h2>🎓 Student Management System</h2>
        <button className="btn-theme" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Students</h4>
          <p className="stat-number">{totalCount}</p>
        </div>
        <div className="stat-card present">
          <h4>Present Today</h4>
          <p className="stat-number">{presentCount}</p>
        </div>
        <div className="stat-card absent">
          <h4>Absent Today</h4>
          <p className="stat-number">{absentCount}</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card form-card">
        <div className="form-header-row">
          <h3>{isEditing ? '✏️ Edit Student Details' : '➕ Add New Student'}</h3>
          <button 
            type="button" 
            className="btn btn-add-course" 
            onClick={() => setShowCourseModal(true)}
          >
            ➕ Add New Course Option
          </button>
        </div>

        <form onSubmit={handleSubmit} className="student-form">
          <input
            type="text"
            name="name"
            placeholder="Student Name *"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="rollNo"
            placeholder="Roll Number *"
            value={formData.rollNo}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address *"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            step="0.01"
            max="10"
            name="cgpa"
            placeholder="CGPA (e.g. 8.5)"
            value={formData.cgpa}
            onChange={handleChange}
          />
          
          <select name="course" value={formData.course} onChange={handleChange}>
            {courses.map((courseItem, index) => (
              <option key={index} value={courseItem}>
                {courseItem}
              </option>
            ))}
          </select>

          <select name="semester" value={formData.semester} onChange={handleChange}>
            <option value="1st">1st Sem</option>
            <option value="2nd">2nd Sem</option>
            <option value="3rd">3rd Sem</option>
            <option value="4th">4th Sem</option>
            <option value="5th">5th Sem</option>
            <option value="6th">6th Sem</option>
          </select>

          {/* Working Upload Photo Button */}
          <div className="file-input-wrapper">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={() => fileInputRef.current.click()}
            >
              📸 {formData.photo ? '✅ Photo Selected!' : 'Upload Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Student' : 'Add Student'}
          </button>

          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsEditing(false);
                resetForm();
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <input
          type="text"
          placeholder="🔍 Search Name, Roll No, Email..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input"
        />

        <select
          value={courseFilter}
          onChange={(e) => { setCourseFilter(e.target.value); setCurrentPage(1); }}
          className="filter-select"
        >
          <option value="All">All Courses</option>
          {courses.map((courseItem, index) => (
            <option key={index} value={courseItem}>
              {courseItem}
            </option>
          ))}
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => { setSemesterFilter(e.target.value); setCurrentPage(1); }}
          className="filter-select"
        >
          <option value="All">All Semesters</option>
          <option value="1st">1st Sem</option>
          <option value="2nd">2nd Sem</option>
          <option value="3rd">3rd Sem</option>
          <option value="4th">4th Sem</option>
          <option value="5th">5th Sem</option>
          <option value="6th">6th Sem</option>
        </select>

        <button onClick={exportToCSV} className="btn btn-csv">
          📥 Export CSV
        </button>
      </div>

      {/* Student Table */}
      <div className="card table-card">
        <table className="student-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th onClick={() => handleSort('rollNo')} className="sortable">
                Roll No {sortKey === 'rollNo' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortKey === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>Email</th>
              <th onClick={() => handleSort('course')} className="sortable">
                Course {sortKey === 'course' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>CGPA</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div className="avatar">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name || 'Student'} />
                      ) : (
                        <span>{(student.name || 'S').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </td>
                  <td>{student.rollNo}</td>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.email}</td>
                  <td><span className="badge">{student.course} ({student.semester})</span></td>
                  <td><strong>{student.cgpa || 'N/A'}</strong></td>
                  <td>
                    <button
                      className={`status-toggle ${(student.status || 'present').toLowerCase()}`}
                      onClick={() => toggleAttendance(student.id)}
                    >
                      {student.status}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon id-card" onClick={() => setSelectedStudent(student)}>🪪 ID</button>
                    <button className="btn-icon edit" onClick={() => handleEdit(student)}>Edit</button>
                    <button className="btn-icon delete" onClick={() => handleDelete(student.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  🚫 Koi matching record nahi mila.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="page-btn"
            >
              Prev
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add New Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content course-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📚 Add New Course</h3>
            <p className="modal-subtext">Is list mein naya course add karein:</p>
            <form onSubmit={handleAddNewCourse}>
              <input
                type="text"
                placeholder="Course Name (e.g. BBA)"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                autoFocus
                required
                className="course-input"
              />
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save Course</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Student ID Card Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="id-card-badge">STUDENT PASSPORT / ID</div>
            <div className="id-card-header">
              <h3>CAMPUS ACADEMY</h3>
              <p>Official Student Identity Card</p>
            </div>
            <div className="id-card-body">
              <div className="id-card-photo">
                {selectedStudent.photo ? (
                  <img src={selectedStudent.photo} alt={selectedStudent.name} />
                ) : (
                  <div className="photo-placeholder">{(selectedStudent.name || 'S').charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="id-card-details">
                <h4>{selectedStudent.name}</h4>
                <p><strong>Roll No:</strong> {selectedStudent.rollNo}</p>
                <p><strong>Course:</strong> {selectedStudent.course}</p>
                <p><strong>Semester:</strong> {selectedStudent.semester}</p>
                <p><strong>CGPA:</strong> {selectedStudent.cgpa || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
              </div>
            </div>
            <div className="id-card-footer">
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print Card</button>
              <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;