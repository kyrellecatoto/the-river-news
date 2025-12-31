// lib/utils/contentEditor.js
export const insertImageIntoContent = (content, imageUrl, altText = '') => {
  const markdownImage = `![${altText}](${imageUrl})\n\n`;
  
  // Get cursor position
  const textarea = document.querySelector('textarea[name="content"]');
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + markdownImage + content.substring(end);
    return newContent;
  }
  
  // If no cursor position, append to end
  return content + '\n\n' + markdownImage;
};