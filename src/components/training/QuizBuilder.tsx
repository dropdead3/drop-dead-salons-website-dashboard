import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  order_index: number;
}

interface QuizBuilderProps {
  videoId: string;
  existingQuizId?: string;
  existingTitle?: string;
  existingPassingScore?: number;
  existingIsRequired?: boolean;
  existingQuestions?: Question[];
  onSaved?: () => void;
}

export function QuizBuilder({
  videoId,
  existingQuizId,
  existingTitle = '',
  existingPassingScore = 80,
  existingIsRequired = false,
  existingQuestions = [],
  onSaved,
}: QuizBuilderProps) {
  const [title, setTitle] = useState(existingTitle);
  const [passingScore, setPassingScore] = useState(existingPassingScore);
  const [isRequired, setIsRequired] = useState(existingIsRequired);
  const [questions, setQuestions] = useState<Question[]>(
    existingQuestions.length > 0
      ? existingQuestions
      : [
          {
            question_text: '',
            question_type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            order_index: 0,
          },
        ]
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        order_index: prev.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    const validQuestions = questions.filter(
      (q) => q.question_text.trim() && q.correct_answer.trim()
    );

    if (validQuestions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setSaving(true);

    try {
      let quizId = existingQuizId;

      if (existingQuizId) {
        // Update existing quiz
        await supabase
          .from('training_quizzes')
          .update({
            title,
            passing_score: passingScore,
            is_required: isRequired,
          })
          .eq('id', existingQuizId);

        // Delete old questions and insert new ones
        await supabase
          .from('training_quiz_questions')
          .delete()
          .eq('quiz_id', existingQuizId);
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from('training_quizzes')
          .insert({
            video_id: videoId,
            title,
            passing_score: passingScore,
            is_required: isRequired,
          })
          .select()
          .single();

        if (error) throw error;
        quizId = data.id;
      }

      // Insert questions
      const questionsToInsert = validQuestions.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options.filter((o) => o.trim()),
        correct_answer: q.correct_answer,
        order_index: index,
      }));

      await supabase.from('training_quiz_questions').insert(questionsToInsert);

      toast.success('Quiz saved successfully');
      onSaved?.();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Quiz settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz Title</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Module 1 Comprehension Check"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passing-score">Passing Score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="font-medium">Required Quiz</p>
            <p className="text-sm text-muted-foreground">
              Team members must pass to mark video complete
            </p>
          </div>
          <Switch checked={isRequired} onCheckedChange={setIsRequired} />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Questions</Label>
            <Badge variant="secondary">{questions.length} questions</Badge>
          </div>

          {questions.map((question, qIndex) => (
            <Card key={qIndex} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{qIndex + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-destructive"
                      onClick={() => removeQuestion(qIndex)}
                      disabled={questions.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Enter your question..."
                    value={question.question_text}
                    onChange={(e) =>
                      updateQuestion(qIndex, { question_text: e.target.value })
                    }
                  />

                  <div className="grid gap-2 md:grid-cols-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className={
                            question.correct_answer === option && option
                              ? 'border-green-500'
                              : ''
                          }
                        />
                        <Button
                          variant={
                            question.correct_answer === option && option
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className={
                            question.correct_answer === option && option
                              ? 'bg-green-600 hover:bg-green-700'
                              : ''
                          }
                          onClick={() =>
                            updateQuestion(qIndex, { correct_answer: option })
                          }
                          disabled={!option.trim()}
                        >
                          ✓
                        </Button>
                      </div>
                    ))}
                  </div>

                  {!question.correct_answer && question.options.some((o) => o.trim()) && (
                    <p className="text-xs text-amber-600">
                      Click ✓ to mark the correct answer
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={addQuestion} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            Add Question
          </Button>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save Quiz
          </Button>
        </div>
      </div>
    </Card>
  );
}
