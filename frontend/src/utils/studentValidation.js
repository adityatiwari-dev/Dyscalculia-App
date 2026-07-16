/**
 * Validation utilities for student registration.
 * Ensures strict compliance with age (5-10) and grade (Kindergarten - Grade 5) constraints.
 */

export const AGE_MIN = 5
export const AGE_MAX = 10

export function validateStudentAge(age) {
  if (age === null || age === undefined || age === '') {
    return { isValid: false, error: 'Age must be between 5 and 10 years to register.' }
  }
  const num = Number(age)
  if (isNaN(num) || !Number.isInteger(num) || num < AGE_MIN || num > AGE_MAX) {
    return { isValid: false, error: 'Age must be between 5 and 10 years to register.' }
  }
  return { isValid: true, error: '' }
}

export function validateStudentGrade(grade) {
  if (grade === null || grade === undefined || typeof grade !== 'string' || !grade.trim()) {
    return { isValid: false, error: 'Please enter a valid grade.' }
  }
  const g = grade.trim().toLowerCase()
  const validPattern = /^(0|k|kg|lkg|ukg|kindergarten|grade\s*k|grade\s*0|[1-5]|grade\s*[1-5]|[1-5](st|nd|rd|th)|(first|second|third|fourth|fifth)(\s*grade)?|grade\s*[1-5](st|nd|rd|th))$/
  
  if (!validPattern.test(g)) {
    return { isValid: false, error: 'Please enter a valid grade.' }
  }
  return { isValid: true, error: '' }
}
