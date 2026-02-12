import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, IconButton, Chip, Tooltip, CircularProgress } from '@mui/material';
import { Add, Remove, CenterFocusStrong, School, Assignment, CheckCircle, RadioButtonUnchecked, Lock } from '@mui/icons-material';
import * as eduApi from '../services/educationApi';
import { getTasks } from '../services/adminApi';

// --- STYLES & CONSTANTS ---
const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const X_GAP = 300;
const Y_GAP = 120; // Vertical gap between parallel tracks

// Helper to calculate tree layout
const calculateLayout = (courses, topics, allTasks) => {
    const nodes = [];
    const edges = [];

    let currentY = 0;

    courses.forEach((course) => {
        // COURSE START NODE
        const courseNodeId = `course-${course._id}`;
        nodes.push({
            id: courseNodeId,
            type: 'course',
            data: course,
            x: 0,
            y: currentY,
            width: 200,
            height: 60
        });

        // Get topics for this course, sorted by order
        const courseTopics = topics
            .filter(t => t.course === course._id)
            .sort((a, b) => a.order - b.order);

        let currentX = 300; // Start topics to the right of course

        if (courseTopics.length === 0) {
            currentY += 150;
            return;
        }

        courseTopics.forEach((topic) => {
            // TOPIC NODE
            const topicNodeId = `topic-${topic._id}`;
            nodes.push({
                id: topicNodeId,
                type: 'topic',
                data: topic,
                x: currentX,
                y: currentY,
                width: 180,
                height: 50
            });

            // EDGE: Course -> Topic
            edges.push({
                from: courseNodeId,
                to: topicNodeId,
                type: 'curved'
            });

            // Connect Course -> First Topic OR Previous Topic -> This Topic
            // Actually, let's connect Course -> Topic 1 -> Topic 2...
            // But wait, Tasks are inside topics.
            // Let's visualize Topics as "Phases" and Tasks as actual nodes to complete?
            // The user wants to see "Tasks he completed". Tasks are the granular units.

            // Layout TASKS below the topic or inline?
            // Let's put tasks extending from the topic node

            const topicTasks = allTasks.filter(t => t.topic === topic._id);

            if (topicTasks.length > 0) {
                // Stack tasks vertically below the topic? Or a cluster?
                // Let's do a vertical stack for tasks relative to the topic X

                topicTasks.forEach((task, tIdx) => {
                    const taskNodeId = `task-${task._id}`;
                    const taskY = currentY + ((tIdx + 1) * 100); // Below topic

                    nodes.push({
                        id: taskNodeId,
                        type: 'task',
                        data: task,
                        x: currentX, // Same X as topic
                        y: taskY,
                        width: 220,
                        height: 80
                    });

                    // Edge from Topic to Task
                    edges.push({
                        from: topicNodeId,
                        to: taskNodeId,
                        type: 'straight'
                    });
                });

                // Connect this topic to next topic
                // Increase X for next topic
                currentX += X_GAP;
            } else {
                currentX += X_GAP;
            }
        });

        // Move Y down for next course, based on the specific course's height (max task depth)
        const maxTasksInTopic = Math.max(...courseTopics.map(t => allTasks.filter(task => task.topic === t._id).length), 0);
        currentY += Math.max(200, (maxTasksInTopic * 120) + 200);
    });

    return { nodes, edges };
};


const AdminSkillTree = ({ studentAddress, completedTasksProp }) => {
    const [loading, setLoading] = useState(true);
    const [viewData, setViewData] = useState({ nodes: [], edges: [] });

    // Canvas State
    const [transform, setTransform] = useState({ x: 100, y: 100, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false); // Ref for event listeners
    const lastMousePos = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [courses, allTopics, allTasks] = await Promise.all([
                    eduApi.getCourses(),
                    eduApi.getTopics(),
                    getTasks()
                ]);

                const layout = calculateLayout(courses, allTopics, allTasks);
                setViewData(layout);
            } catch (err) {
                console.error("Failed to load tree data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- MOUSE & TOUCH HANDLERS (Panning & Zooming) ---
    // Use useLayoutEffect to ensure we attach listener immediately after DOM updates
    React.useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // WHEEL ZOOM
        const handleWheel = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;

            setTransform(prev => {
                const newScale = Math.min(Math.max(prev.scale + delta, 0.1), 4);
                const worldX = (mouseX - prev.x) / prev.scale;
                const worldY = (mouseY - prev.y) / prev.scale;
                const newX = mouseX - worldX * newScale;
                const newY = mouseY - worldY * newScale;

                return { x: newX, y: newY, scale: newScale };
            });
        };

        console.log('Attaching events to container', container);
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // --- POINTER HANDLERS (Unified Mouse & Touch) ---
    const handlePointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Only left click or touch
        if (e.button !== 0) return;

        const container = containerRef.current;
        if (container) {
            container.setPointerCapture(e.pointerId);
        }

        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();

        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setTransform(prev => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy
        }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const container = containerRef.current;
        if (container) {
            container.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '600px',
                bgcolor: '#09090b',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: 1, // SHARP
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none', // CRITICAL: Disable browser touch actions
                outline: 'none',     // Remove focus outline
                zIndex: 1            // Ensure it's above background
            }}
            tabIndex={0} // Make focusable
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // Handle leaving same as up? Or just cancel drag
            onPointerCancel={handlePointerUp}
        >
            {/* BACKGROUND GRID */}
            <Box sx={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(#ffffff20 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.1,
                transform: `translate(${transform.x % 40}px, ${transform.y % 40}px) scale(${transform.scale})`, // Parallax-ish grid
                pointerEvents: 'none'
            }} />

            {/* CONTROLS */}
            <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 1, zIndex: 10, flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.5)', px: 0.5, borderRadius: 0.5 }}>v2.4 Pointer Events</Typography>
                <Paper sx={{ bgcolor: 'rgba(0,0,0,0.6)', p: 0.5, borderRadius: 1 }}>
                    <IconButton size="small" onClick={() => setTransform(t => ({ ...t, scale: t.scale + 0.1 }))}><Add sx={{ color: '#fff' }} /></IconButton>
                    <IconButton size="small" onClick={() => setTransform(t => ({ ...t, scale: t.scale - 0.1 }))}><Remove sx={{ color: '#fff' }} /></IconButton>
                    <IconButton size="small" onClick={() => setTransform({ x: 100, y: 100, scale: 1 })}><CenterFocusStrong sx={{ color: '#fff' }} /></IconButton>
                </Paper>
            </Box>

            {/* CANVAS CONTENT */}
            <Box sx={{
                transformOrigin: '0 0',
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                position: 'absolute',
                top: 0, left: 0,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}>

                {/* EDGES */}
                <svg style={{ position: 'absolute', top: -5000, left: -5000, width: 20000, height: 20000, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
                    {viewData.edges.map((edge, i) => {
                        const fromNode = viewData.nodes.find(n => n.id === edge.from);
                        const toNode = viewData.nodes.find(n => n.id === edge.to);
                        if (!fromNode || !toNode) return null;

                        const startX = fromNode.x + (fromNode.width / 2); // Center of source
                        const startY = fromNode.y + fromNode.height; // Bottom of source
                        const endX = toNode.x + (toNode.width / 2); // Center of target
                        const endY = toNode.y; // Top of target

                        // For Topic -> Task (vertical), straight line looks good
                        // For Course -> Topic (horizontal-ish), curve looks good

                        let d = '';
                        if (edge.type === 'curved') {
                            // Curve from Right of Course to Left of Topic? Or Bottom to Top?
                            // Current layout: Course (0, Y) -> Topic (300, Y). Horizontal
                            // Course Width 200. Center 100.
                            // Topic Width 180. Center 90.
                            // But my strict logic above calculates Center Bottom to Center Top.
                            // Since Course and Topic might be on similiar Y level...
                            // Let's adjust connection points.

                            // If Course and Topic are roughly on same Y, connect Right to Left
                            if (Math.abs(fromNode.y - toNode.y) < 100) {
                                // Right of Course
                                const sX = fromNode.x + fromNode.width;
                                const sY = fromNode.y + (fromNode.height / 2);
                                // Left of Topic
                                const eX = toNode.x;
                                const eY = toNode.y + (toNode.height / 2);

                                const c1x = sX + 50;
                                const c1y = sY;
                                const c2x = eX - 50;
                                const c2y = eY;

                                d = `M ${sX} ${sY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${eX} ${eY}`;
                            } else {
                                // Standard top-down curve
                                d = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
                            }
                        } else {
                            // Straight-ish curve for tasks
                            d = `M ${startX} ${startY} C ${startX} ${startY + 30}, ${endX} ${endY - 30}, ${endX} ${endY}`;
                        }

                        return (
                            <path
                                key={i}
                                d={d}
                                stroke="#475569"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={edge.type === 'straight' ? "4,4" : "none"}
                            />
                        );
                    })}
                </svg>

                {/* NODES */}
                {viewData.nodes.map(node => {
                    const isCompleted = node.type === 'task' ? completedTasksProp.some(ct => (ct._id || ct) === node.data._id) : false;

                    return (
                        <Paper
                            key={node.id}
                            elevation={4}
                            sx={{
                                position: 'absolute',
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height,
                                p: 0,
                                bgcolor: node.type === 'course'
                                    ? 'rgba(59, 130, 246, 0.1)'
                                    : node.type === 'topic'
                                        ? 'rgba(0,0,0,0.8)' // Darker for topics
                                        : isCompleted
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(30, 41, 59, 0.9)',
                                border: isCompleted
                                    ? '1px solid #34d399'
                                    : node.type === 'course'
                                        ? '1px solid #3b82f6'
                                        : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '2px', // EXTRA SHARP
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    zIndex: 10,
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 0 0 2px #fff'
                                }
                            }}
                        >
                            {/* STATUS STRIP */}
                            <Box sx={{
                                width: 6,
                                height: '100%',
                                bgcolor: isCompleted ? '#34d399' : node.type === 'course' ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                            }} />

                            <Box sx={{ p: 1.5, flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                                    {node.type === 'course' ? 'КУРС' : node.type === 'topic' ? 'ТЕМА' : 'ЗАВДАННЯ'}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {node.data.title || node.data.name}
                                </Typography>
                                {node.type === 'task' && (
                                    <Chip
                                        label={`${node.data.points} XP`}
                                        size="small"
                                        sx={{
                                            mt: 0.5,
                                            height: 18,
                                            fontSize: '0.6rem',
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            color: '#cbd5e1'
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ pr: 1.5 }}>
                                {node.type === 'course' && <School sx={{ color: '#3b82f6' }} />}
                                {node.type === 'task' && (
                                    isCompleted ? <CheckCircle sx={{ color: '#34d399' }} /> : <Lock sx={{ color: 'rgba(255,255,255,0.2)' }} />
                                )}
                            </Box>
                        </Paper>
                    );
                })}


            </Box>
        </Box>
    );
};

export default AdminSkillTree;
