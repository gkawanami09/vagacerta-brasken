import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'vagacerta.db');

const seedData = {
  jobs: [
    {
      title: 'Desenvolvedor React Senior',
      company: 'Tech Company',
      description: 'Procuramos um desenvolvedor React experiente para liderar nosso time de frontend.',
      requirements: 'React, TypeScript, Node.js, 5+ anos de experiência',
      responsibilities: 'Desenvolver componentes, mentorear junior, code review',
      benefits: 'Vale refeição, vale transporte, home office',
      location: 'São Paulo, SP',
      salary_min: 8000,
      salary_max: 12000,
      contract_type: 'CLT',
      modality: 'Híbrido',
      compatibility: 92,
      company_logo: 'https://via.placeholder.com/100',
      company_description: 'Empresa de tecnologia focada em SaaS',
      selection_process: 'Entrevista técnica, entrevista com RH, teste prático'
    },
    {
      title: 'Desenvolvedor Full Stack Node.js',
      company: 'Startup Inovadora',
      description: 'Buscamos um desenvolvedor full stack para construir nossa plataforma.',
      requirements: 'Node.js, React, SQLite, 3+ anos',
      responsibilities: 'Desenvolver API, componentes frontend, deploy',
      benefits: 'Equity, home office 100%, vale refeição',
      location: 'Rio de Janeiro, RJ',
      salary_min: 6000,
      salary_max: 9000,
      contract_type: 'CLT',
      modality: 'Remoto',
      compatibility: 85,
      company_logo: 'https://via.placeholder.com/100',
      company_description: 'Startup de tecnologia em crescimento',
      selection_process: 'Entrevista inicial, teste técnico, entrevista final'
    },
    {
      title: 'Engenheiro de Software Backend',
      company: 'Big Tech Corp',
      description: 'Procuramos engenheiro de software para trabalhar em sistemas distribuídos.',
      requirements: 'Java/Go, Microserviços, Docker, Kubernetes, 4+ anos',
      responsibilities: 'Arquitetura de sistemas, otimização de performance',
      benefits: 'Bônus anual, plano de saúde premium, vale refeição',
      location: 'São Paulo, SP',
      salary_min: 10000,
      salary_max: 15000,
      contract_type: 'CLT',
      modality: 'Presencial',
      compatibility: 78,
      company_logo: 'https://via.placeholder.com/100',
      company_description: 'Grande empresa de tecnologia multinacional',
      selection_process: 'Múltiplas entrevistas técnicas, entrevista com VP'
    },
    {
      title: 'Frontend Developer',
      company: 'Digital Agency',
      description: 'Agência digital procura desenvolvedor frontend criativo.',
      requirements: 'React, Vue ou Angular, CSS, 2+ anos',
      responsibilities: 'Desenvolver interfaces, trabalhar com design',
      benefits: 'Vale refeição, vale transporte, cursos',
      location: 'Belo Horizonte, MG',
      salary_min: 4000,
      salary_max: 6500,
      contract_type: 'CLT',
      modality: 'Presencial',
      compatibility: 88,
      company_logo: 'https://via.placeholder.com/100',
      company_description: 'Agência digital de design e desenvolvimento',
      selection_process: 'Entrevista, portfólio review, teste prático'
    },
    {
      title: 'DevOps Engineer',
      company: 'Cloud Solutions',
      description: 'Procuramos DevOps para gerenciar infraestrutura em cloud.',
      requirements: 'AWS/GCP, Docker, Kubernetes, Terraform, 3+ anos',
      responsibilities: 'CI/CD, monitoramento, segurança da infraestrutura',
      benefits: 'Home office, bônus, cursos de certificação',
      location: 'São Paulo, SP',
      salary_min: 7000,
      salary_max: 11000,
      contract_type: 'CLT',
      modality: 'Remoto',
      compatibility: 81,
      company_logo: 'https://via.placeholder.com/100',
      company_description: 'Empresa especializada em soluções cloud',
      selection_process: 'Entrevista técnica, case study'
    },
  ],
  courses: [
    {
      title: 'React Avançado',
      description: 'Aprenda React em nível avançado com hooks, context, performance optimization.',
      skills: 'React, JavaScript, TypeScript',
      duration_hours: 40,
      price: 0,
      is_free: 1,
      certification: 1,
      provider: 'Alura',
      thumbnail: 'https://via.placeholder.com/200',
      external_url: 'https://www.alura.com.br',
      recommended_for_user: 1
    },
    {
      title: 'Node.js Completo',
      description: 'Curso completo de Node.js com Express, banco de dados e deployment.',
      skills: 'Node.js, Express, SQLite',
      duration_hours: 50,
      price: 19900,
      is_free: 0,
      certification: 1,
      provider: 'Udemy',
      thumbnail: 'https://via.placeholder.com/200',
      external_url: 'https://www.udemy.com',
      recommended_for_user: 1
    },
    {
      title: 'TypeScript Essencial',
      description: 'Domine TypeScript e melhore a qualidade do seu código.',
      skills: 'TypeScript, JavaScript',
      duration_hours: 30,
      price: 0,
      is_free: 1,
      certification: 0,
      provider: 'Rocketseat',
      thumbnail: 'https://via.placeholder.com/200',
      external_url: 'https://rocketseat.com.br',
      recommended_for_user: 1
    },
    {
      title: 'Docker & Kubernetes',
      description: 'Aprenda containerização e orquestração de containers.',
      skills: 'Docker, Kubernetes, DevOps',
      duration_hours: 45,
      price: 29900,
      is_free: 0,
      certification: 1,
      provider: 'Linux Academy',
      thumbnail: 'https://via.placeholder.com/200',
      external_url: 'https://www.linuxacademy.com',
      recommended_for_user: 0
    },
    {
      title: 'Preparação para Entrevistas Tech',
      description: 'Prepare-se para entrevistas técnicas com algoritmos e system design.',
      skills: 'Algoritmos, System Design, Entrevista',
      duration_hours: 35,
      price: 9900,
      is_free: 0,
      certification: 0,
      provider: 'Codementor',
      thumbnail: 'https://via.placeholder.com/200',
      external_url: 'https://www.codementor.io',
      recommended_for_user: 1
    },
  ]
};

async function seedDatabase() {
  try {
    const db = new Database(dbPath);
    
    console.log('Connected to SQLite database');

    // Clear existing data
    db.exec('DELETE FROM jobs');
    db.exec('DELETE FROM courses');
    console.log('Cleared existing data');

    // Insert jobs
    const jobStmt = db.prepare(`
      INSERT INTO jobs (
        title, company, description, requirements, responsibilities, benefits,
        location, salary_min, salary_max, contract_type, modality, compatibility,
        company_logo, company_description, selection_process
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const job of seedData.jobs) {
      jobStmt.run(
        job.title, job.company, job.description, job.requirements, job.responsibilities,
        job.benefits, job.location, job.salary_min, job.salary_max, job.contract_type,
        job.modality, job.compatibility, job.company_logo, job.company_description,
        job.selection_process
      );
    }
    console.log(`Inserted ${seedData.jobs.length} jobs`);

    // Insert courses
    const courseStmt = db.prepare(`
      INSERT INTO courses (
        title, description, skills, duration_hours, price, is_free, certification,
        provider, thumbnail, external_url, recommended_for_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const course of seedData.courses) {
      courseStmt.run(
        course.title, course.description, course.skills, course.duration_hours,
        course.price, course.is_free, course.certification, course.provider,
        course.thumbnail, course.external_url, course.recommended_for_user
      );
    }
    console.log(`Inserted ${seedData.courses.length} courses`);

    db.close();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
