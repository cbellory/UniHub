const API_URL = '/api/education';

// --- COURSES ---
export const getCourses = async () => {
    const res = await fetch(`${API_URL}/courses`);
    if (!res.ok) throw new Error('Error fetching courses');
    return res.json();
};

export const createCourse = async (courseData) => {
    const res = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
    });
    if (!res.ok) throw new Error('Error creating course');
    return res.json();
};

export const updateCourse = async (id, courseData) => {
    const res = await fetch(`${API_URL}/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
    });
    if (!res.ok) throw new Error('Error updating course');
    return res.json();
};

export const deleteCourse = async (id) => {
    const res = await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting course');
    return res.json();
};

// --- TOPICS ---
export const getTopics = async (courseId) => {
    const url = courseId ? `${API_URL}/topics?courseId=${courseId}` : `${API_URL}/topics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error fetching topics');
    return res.json();
};

export const createTopic = async (topicData) => {
    const res = await fetch(`${API_URL}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
    });
    if (!res.ok) throw new Error('Error creating topic');
    return res.json();
};

export const updateTopic = async (id, topicData) => {
    const res = await fetch(`${API_URL}/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
    });
    if (!res.ok) throw new Error('Error updating topic');
    return res.json();
};

export const deleteTopic = async (id) => {
    const res = await fetch(`${API_URL}/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting topic');
    return res.json();
};

// --- GROUPS ---
export const getGroups = async () => {
    const res = await fetch(`${API_URL}/groups`);
    if (!res.ok) throw new Error('Error fetching groups');
    return res.json();
};

export const createGroup = async (groupData) => {
    const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
    });
    if (!res.ok) throw new Error('Error creating group');
    return res.json();
};

export const updateGroup = async (id, groupData) => {
    const res = await fetch(`${API_URL}/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
    });
    if (!res.ok) throw new Error('Error updating group');
    return res.json();
};

export const deleteGroup = async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting group');
    return res.json();
};
