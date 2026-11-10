import React from 'react';
import { isCorrect, type Question } from './types';

export function AnswerFeedback({ question, answer }: { question: Question; answer?: string }) {
  // Only a confirmed answer belongs here; drafts must not reveal the explanation.
  if (answer === undefined) return null;
  const correct = isCorrect(question, answer);
  const selected = question.options?.find(option => option.id === answer);
  const expected = question.numeric
    ? `${question.numeric.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${question.numeric.unit}`
    : question.options?.find(option => option.id === question.answer)?.text;

  return <div className="answer-feedback">
    {!correct && selected && <section className="feedback-part feedback-mistake">
      <h4>Por que sua resposta não se aplica</h4>
      <p className="feedback-answer"><strong>Você marcou:</strong> {selected.text}</p>
      <p>{selected.whyIncorrect}</p>
    </section>}
    {!correct && question.numeric && <p><strong>Seu resultado:</strong> {answer} {question.numeric.unit}</p>}
    <section className="feedback-part feedback-correct">
      <h4>{question.numeric ? 'Como chegar ao resultado' : 'Por que a resposta correta se aplica'}</h4>
      <p className="feedback-answer"><strong>{question.numeric ? 'Resultado esperado:' : 'Resposta correta:'}</strong> {expected}</p>
      <p>{question.explanation}</p>
    </section>
  </div>;
}
