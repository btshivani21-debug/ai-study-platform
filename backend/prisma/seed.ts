import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create subjects
  const python = await prisma.subject.upsert({
    where: { slug: 'python-programming' },
    update: {},
    create: {
      title: 'Python Programming',
      slug: 'python-programming',
      description: 'Learn Python from scratch. Cover basics, data types, control flow, functions, OOP, and more.',
      thumbnail: 'https://img.youtube.com/vi/kqtD5dpn9C8/maxresdefault.jpg',
      is_published: true,
    },
  });

  const dsa = await prisma.subject.upsert({
    where: { slug: 'data-structures' },
    update: {},
    create: {
      title: 'Data Structures',
      slug: 'data-structures',
      description: 'Master essential data structures including arrays, linked lists, trees, graphs, and hash tables.',
      thumbnail: 'https://img.youtube.com/vi/8hly31xKli0/maxresdefault.jpg',
      is_published: true,
    },
  });

  const webdev = await prisma.subject.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: {
      title: 'Web Development',
      slug: 'web-development',
      description: 'Full-stack web development covering HTML, CSS, JavaScript, React, and Node.js.',
      thumbnail: 'https://img.youtube.com/vi/nu_pCVPKzTk/maxresdefault.jpg',
      is_published: true,
    },
  });

  // Python sections and videos
  const pyBasics = await prisma.section.create({
    data: {
      subject_id: python.id,
      title: 'Getting Started with Python',
      order_index: 0,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: pyBasics.id,
        title: 'Python Tutorial for Beginners',
        description: 'A complete introduction to Python programming language.',
        youtube_url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
        order_index: 0,
        duration_seconds: 3600,
      },
      {
        section_id: pyBasics.id,
        title: 'Python Variables and Data Types',
        description: 'Learn about variables, strings, numbers, and data types in Python.',
        youtube_url: 'https://www.youtube.com/watch?v=cQT33yu9pY8',
        order_index: 1,
        duration_seconds: 1200,
      },
      {
        section_id: pyBasics.id,
        title: 'Python Control Flow',
        description: 'If statements, loops, and control flow in Python.',
        youtube_url: 'https://www.youtube.com/watch?v=Zp5MuPOtsSY',
        order_index: 2,
        duration_seconds: 900,
      },
    ],
  });

  const pyAdvanced = await prisma.section.create({
    data: {
      subject_id: python.id,
      title: 'Python Functions and OOP',
      order_index: 1,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: pyAdvanced.id,
        title: 'Python Functions',
        description: 'Learn how to define and use functions in Python.',
        youtube_url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
        order_index: 0,
        duration_seconds: 1500,
      },
      {
        section_id: pyAdvanced.id,
        title: 'Object Oriented Programming in Python',
        description: 'Learn OOP concepts: classes, objects, inheritance, and polymorphism.',
        youtube_url: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
        order_index: 1,
        duration_seconds: 2400,
      },
    ],
  });

  // DSA sections and videos
  const dsaBasics = await prisma.section.create({
    data: {
      subject_id: dsa.id,
      title: 'Introduction to Data Structures',
      order_index: 0,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: dsaBasics.id,
        title: 'Data Structures Easy to Advanced',
        description: 'Complete guide to data structures from basics to advanced.',
        youtube_url: 'https://www.youtube.com/watch?v=8hly31xKli0',
        order_index: 0,
        duration_seconds: 28800,
      },
      {
        section_id: dsaBasics.id,
        title: 'Arrays and Linked Lists',
        description: 'Understanding arrays and linked lists.',
        youtube_url: 'https://www.youtube.com/watch?v=zg9ih6SVACc',
        order_index: 1,
        duration_seconds: 2700,
      },
    ],
  });

  const dsaTrees = await prisma.section.create({
    data: {
      subject_id: dsa.id,
      title: 'Trees and Graphs',
      order_index: 1,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: dsaTrees.id,
        title: 'Binary Trees and BST',
        description: 'Learn binary trees, binary search trees, and tree traversals.',
        youtube_url: 'https://www.youtube.com/watch?v=fAAZixBzIAI',
        order_index: 0,
        duration_seconds: 3600,
      },
      {
        section_id: dsaTrees.id,
        title: 'Graph Algorithms',
        description: 'BFS, DFS, and shortest path algorithms.',
        youtube_url: 'https://www.youtube.com/watch?v=tWVWeAqZ0WU',
        order_index: 1,
        duration_seconds: 4200,
      },
    ],
  });

  // Web Development sections and videos
  const webBasics = await prisma.section.create({
    data: {
      subject_id: webdev.id,
      title: 'HTML & CSS Fundamentals',
      order_index: 0,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: webBasics.id,
        title: 'HTML Full Course',
        description: 'Complete HTML tutorial for beginners.',
        youtube_url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk',
        order_index: 0,
        duration_seconds: 7200,
      },
      {
        section_id: webBasics.id,
        title: 'CSS Full Course',
        description: 'Complete CSS tutorial covering layouts, flexbox, grid.',
        youtube_url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
        order_index: 1,
        duration_seconds: 6600,
      },
    ],
  });

  const webJS = await prisma.section.create({
    data: {
      subject_id: webdev.id,
      title: 'JavaScript Essentials',
      order_index: 1,
    },
  });

  await prisma.video.createMany({
    data: [
      {
        section_id: webJS.id,
        title: 'JavaScript Tutorial for Beginners',
        description: 'Learn JavaScript from scratch.',
        youtube_url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        order_index: 0,
        duration_seconds: 12600,
      },
      {
        section_id: webJS.id,
        title: 'React JS Full Course',
        description: 'Learn React.js - the complete guide.',
        youtube_url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
        order_index: 1,
        duration_seconds: 43200,
      },
    ],
  });

  console.log('Seed data created successfully!');
  console.log(`Created subjects: ${python.title}, ${dsa.title}, ${webdev.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
