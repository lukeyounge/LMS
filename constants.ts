import { Course, LessonType, UserRole } from './types';

// NOTE: CURRENT_USER is removed. Use AuthContext instead.

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    instructorId: 'u2',
    title: 'Complete Python Mastery',
    description: 'Master Python by building 100 projects in 100 days. Learn automation, game, app and web development, data science and machine learning.',
    thumbnailUrl: 'https://picsum.photos/800/600?random=1',
    instructorName: 'Dr. Angela Yu',
    price: 499,
    category: 'Development',
    level: 'Beginner',
    totalStudents: 15430,
    rating: 4.8,
    sections: [
      {
        id: 's1',
        courseId: 'c1',
        title: 'Introduction to Python',
        order: 1,
        lessons: [
          {
            id: 'l1',
            sectionId: 's1',
            title: 'Why Python?',
            type: LessonType.VIDEO,
            duration: 5,
            content: 'https://www.youtube.com/embed/nLRL_NcnK-4', // Placeholder embed
            isCompleted: true,
            isLocked: false
          },
          {
            id: 'l2',
            sectionId: 's1',
            title: 'Installation and Setup',
            type: LessonType.TEXT,
            duration: 10,
            content: '# Installation\n\n1. Download Python from python.org\n2. Run the installer\n3. Check "Add Python to PATH"',
            isCompleted: false,
            isLocked: false
          }
        ]
      },
      {
        id: 's2',
        courseId: 'c1',
        title: 'Python Basics',
        order: 2,
        lessons: [
          {
            id: 'l3',
            sectionId: 's2',
            title: 'Variables and Types',
            type: LessonType.VIDEO,
            duration: 15,
            content: 'https://www.youtube.com/embed/_uQrJ0TkZlc',
            isCompleted: false,
            isLocked: true
          },
          {
            id: 'l4',
            sectionId: 's2',
            title: 'Quiz: Python Basics',
            type: LessonType.QUIZ,
            duration: 10,
            content: JSON.stringify({
              passingScore: 60,
              questions: [
                {
                  id: 1,
                  question: "Which function is used to output text to the console in Python?",
                  options: ["console.log()", "print()", "echo()", "write()"],
                  correctAnswerIndex: 1
                },
                {
                  id: 2,
                  question: "How do you start a comment in Python?",
                  options: ["//", "/*", "#", "<!--"],
                  correctAnswerIndex: 2
                },
                {
                  id: 3,
                  question: "Which of the following is a valid variable name?",
                  options: ["2my_var", "my-var", "my_var", "my var"],
                  correctAnswerIndex: 2
                }
              ]
            }),
            isCompleted: false,
            isLocked: true
          }
        ]
      }
    ]
  },
  {
    id: 'c2',
    instructorId: 'u1', 
    title: 'React for Beginners',
    description: 'A comprehensive guide to building modern web applications with React 18, Hooks, and TypeScript.',
    thumbnailUrl: 'https://picsum.photos/800/600?random=2',
    instructorName: 'Alex Student', 
    price: 350,
    category: 'Web Development',
    level: 'Intermediate',
    totalStudents: 8500,
    rating: 4.7,
    sections: []
  },
  {
    id: 'c3',
    instructorId: 'u3',
    title: 'Data Science Bootcamp',
    description: 'Learn Data Science, Data Analysis, Machine Learning (AI) using Python, Pandas, NumPy, Scikit-Learn.',
    thumbnailUrl: 'https://picsum.photos/800/600?random=3',
    instructorName: 'Jose Portilla',
    price: 599,
    category: 'Data Science',
    level: 'Advanced',
    totalStudents: 12000,
    rating: 4.9,
    sections: []
  }
];