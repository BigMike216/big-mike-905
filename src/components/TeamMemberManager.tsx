import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface TeamMemberManagerProps {
  teamId: string;
  teamName: string;
}

export const TeamMemberManager = ({ teamId, teamName }: TeamMemberManagerProps) => {
  const [members, setMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load members from localStorage on component mount
  useEffect(() => {
    const savedMembers = localStorage.getItem(`team-${teamId}-members`);
    if (savedMembers) {
      setMembers(JSON.parse(savedMembers));
    }
  }, [teamId]);

  // Save members to localStorage whenever members change
  useEffect(() => {
    localStorage.setItem(`team-${teamId}-members`, JSON.stringify(members));
  }, [members, teamId]);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      setMembers(prev => [...prev, newMemberName.trim()]);
      setNewMemberName('');
      setIsAddDialogOpen(false);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingName(members[index]);
  };

  const handleSaveEdit = () => {
    if (editingName.trim() && editingIndex !== null) {
      setMembers(prev => prev.map((member, index) => 
        index === editingIndex ? editingName.trim() : member
      ));
      setEditingIndex(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingName('');
  };

  const handleDeleteMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">{teamName} Members</h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>
                  Add Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-lg mb-4">No team members yet</div>
            <p className="text-muted-foreground/70 text-center">Add team members to keep track of who's in this team</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {members.map((member, index) => (
            <Card key={index} className="transition-all hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-foreground font-medium">{member}</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleStartEdit(index)}
                        className="hover:bg-secondary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDeleteMember(index)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};