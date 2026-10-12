import { api } from './api';

export const documentTypes = [
  { type: 'CV', label: 'CV / Resume', endpoint: 'cv', accepted: '.pdf,.doc,.docx', mime: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { type: 'GRADE_8', label: 'Grade 8 Certificate', endpoint: 'grade8', accepted: '.pdf,.jpg,.jpeg,.png', mime: 'application/pdf,image/jpeg,image/png' },
  { type: 'GRADE_12', label: 'Grade 12 Certificate', endpoint: 'grade12', accepted: '.pdf,.jpg,.jpeg,.png', mime: 'application/pdf,image/jpeg,image/png' },
  { type: 'DEGREE', label: 'Degree Certificate', endpoint: 'degree', accepted: '.pdf,.jpg,.jpeg,.png', mime: 'application/pdf,image/jpeg,image/png' },
];

export const getMyDocuments = () => api.getMyDocuments();

export function uploadDocument(documentType, file) {
  const formData = new FormData();
  formData.append('document', file);
  return api.uploadDocument(documentType.endpoint, formData);
}

export function deleteDocument(documentId) {
  return api.deleteDocument(documentId);
}

export function viewDocument(documentId) {
  const token = localStorage.getItem('ajp_token');
  return fetch(`${import.meta.env.VITE_API_URL || '/api'}/documents/${documentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
