'use client';

import { useState } from 'react';
import { useComments } from '@/lib/hooks/useComments';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatTime } from '@/lib/utils/formatTime';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
}

export function CommentsModal({ isOpen, onClose, videoId }: CommentsModalProps) {
  const { comments, loading, addComment, deleteComment } = useComments(videoId);
  const auth = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    await addComment(commentText);
    setCommentText('');
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      await deleteComment(commentId);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#141414',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 600 }}>
            Comentários
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '32px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {auth.isAuthenticated && !auth.isGuest && (
            <div
              style={{
                marginBottom: '24px',
                paddingBottom: '24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <form onSubmit={handleSubmit}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                    resize: 'vertical',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  style={{
                    padding: '10px 24px',
                    background: submitting ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #e50914, #f40612)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  {submitting ? 'Enviando...' : 'Comentar'}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '40px 20px' }}>
                Nenhum comentário ainda. Seja o primeiro!
              </p>
            ) : (
              comments.map((comment) => {
                const isOwnComment = auth.user?.id === comment.user_id;
                return (
                  <div
                    key={comment.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      background: isOwnComment ? 'rgba(229, 9, 20, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      border: isOwnComment ? '1px solid rgba(229, 9, 20, 0.2)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '18px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          {comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          gap: '12px',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>
                          {comment.profiles?.username || 'Usuário'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {isOwnComment && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              style={{
                                background: 'rgba(255, 68, 68, 0.2)',
                                border: '1px solid rgba(255, 68, 68, 0.4)',
                                color: '#ff6b6b',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '18px',
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      <p
                        style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '14px',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          margin: 0,
                        }}
                      >
                        {comment.comment_text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


