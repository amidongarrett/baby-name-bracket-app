export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "Full-stack e-commerce solution with shopping cart, payment integration, and admin dashboard for inventory management.",
      techStack: ["Next.js", "React", "Stripe", "PostgreSQL", "Tailwind CSS"],
    },
    {
      id: 2,
      title: "AI Task Automation System",
      description: "Intelligent workflow automation platform that uses AI agents to streamline business processes and reduce manual work.",
      techStack: ["Python", "OpenAI API", "FastAPI", "Docker", "Redis"],
    },
    {
      id: 3,
      title: "Real-Time Analytics Dashboard",
      description: "Interactive data visualization dashboard with live updates, custom reporting, and multi-user collaboration features.",
      techStack: ["React", "D3.js", "Node.js", "MongoDB", "WebSockets"],
    },
  ];

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            My Projects
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A showcase of my recent work in web development, AI systems, and software engineering.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              {/* Project Title */}
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                {project.title}
              </h2>

              {/* Project Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="mt-auto">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tech Stack:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
