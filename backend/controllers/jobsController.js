const getJobs = (req, res) => {
  const jobs = [
    {
      id: 1,
      title: "Junior Frontend Developer",
      company: "TechCorp",
      location: "London",
      level: "Entry Level",
      skills: ["HTML", "CSS", "JavaScript"],
      url: "#"
    },
    {
      id: 2,
      title: "Graduate Software Engineer",
      company: "DevWorks",
      location: "Remote",
      level: "Entry Level",
      skills: ["JavaScript", "React"],
      url: "#"
    }
  ];

  res.json(jobs);
};

module.exports = { getJobs };