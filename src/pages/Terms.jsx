import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="page legal-page">
      <h1>Terms of Service</h1>
      <p>By using <strong>NonFictionFooty</strong>, you agree to use the service in line with TikTok’s and our terms.</p>
      <p>You are responsible for the content you create and publish. Do not post content that infringes others’ rights or violates applicable law or platform rules.</p>
      <p>We provide the tool “as is”; we are not liable for how you use it or for TikTok’s handling of your content.</p>
      <p><Link to="/">Back to NonFictionFooty</Link></p>
    </div>
  );
}
