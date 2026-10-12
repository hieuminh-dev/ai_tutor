import API from "./api";

export const authService = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  me: () => API.get("/auth/me"),
};

export const profileService = {
  update: (data) => API.put("/profile/update", data),
};

export const assessmentService = {
  getSubjects: () => API.get("/assessment/subjects"),
  start: (subjectId) => API.get(`/assessment/start/${subjectId}`),
  submit: (data) => API.post("/assessment/submit", data),
  getResults: () => API.get("/assessment/results"),
};

export const lessonsService = {
  getBySubject: (subjectId) => API.get(`/lessons/subject/${subjectId}`),
  start: (lessonId) => API.post(`/lessons/${lessonId}/start`),
  distract: (lessonId) => API.post(`/lessons/${lessonId}/distract`),
  complete: (lessonId, data) => API.post(`/lessons/${lessonId}/complete`, data),
  getQuiz: (lessonId) => API.get(`/lessons/${lessonId}/quiz`),
  submitQuiz: (lessonId, data) => API.post(`/lessons/${lessonId}/quiz/submit`, data),
};

export const learningPathService = {
  generate: (data) => API.post("/learning-path/generate", data),
  get: () => API.get("/learning-path/"),
  regenerate: () => API.post("/learning-path/regenerate"),
};

export const chatService = {
  sendMessage: (message) => API.post("/chat/message", { message }),
  getHistory: (page = 1) => API.get(`/chat/history?page=${page}`),
  clearHistory: () => API.delete("/chat/clear"),
};

export const recommendationsService = {
  get: () => API.get("/recommendations/"),
  getPerformancePrediction: () => API.get("/recommendations/performance"),
};

export const dashboardService = {
  getStats: () => API.get("/dashboard/stats"),
  getWeeklyProgress: () => API.get("/dashboard/weekly-progress"),
  getQuizPerformance: () => API.get("/dashboard/quiz-performance"),
  getTopicMastery: () => API.get("/dashboard/topic-mastery"),
  getAchievements: () => API.get("/dashboard/achievements"),
};
