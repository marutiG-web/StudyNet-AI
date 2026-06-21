import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
  useEffect(() => {
    // Set Document Title
    document.title = `${title} | StudyNet.AI`;

    // Manage Description Tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      description || 'StudyNet.AI - The premium next-generation AI-powered student-faculty college companion.'
    );

    // Manage Keywords Tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute(
      'content',
      keywords || 'studynet, ai, college application, research companion, dynamic pages, student tools, study system'
    );
  }, [title, description, keywords]);

  return null;
};

export default SEO;
