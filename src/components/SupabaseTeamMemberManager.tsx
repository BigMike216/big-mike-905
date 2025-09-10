import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useSupabaseData, type TeamMember } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';

interface SupabaseTeamMemberManagerProps {
  teamId: string;
  teamName: string;
}

export const SupabaseTeamMemberManager = ({ teamId, teamName }: SupabaseTeamMemberManagerProps) => {
  const { user } = useAuth();
  const { members, addTeamMember, updateTeamMember, deleteTeamMember, loading } = useSupabaseData();
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const canEdit = user?.role === 'host';

  // Filter members for this specific team
  const teamMembers = members.filter(member => member.team_id === teamId);

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await addTeamMember(newMemberName, teamId);
      setNewMemberName('');
      setIsAddDialogOpen(false);
    }
  };

  const handleStartEdit = (member: TeamMember) => {
    setEditingMember(member.id);
    setEditingName(member.name);
  };

  const handleSaveEdit = async () => {
    if (editingName.trim() && editingMember) {
      await updateTeamMember(editingMember, editingName);
      setEditingMember(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditingName('');
  };

  const handleDeleteMember = async (memberId: string) => {
    await deleteTeamMember(memberId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">{teamName} Members</h3>
        
        {canEdit && (
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
        )}
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-lg mb-4">No team members yet</div>
            <p className="text-muted-foreground/70 text-center">Add team members to keep track of who's in this team</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {teamMembers.map((member) => (
            <Card key={member.id} className="transition-all hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                {canEdit && editingMember === member.id ? (
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
                    <span className="text-foreground font-medium">{member.name}</span>
                    {canEdit && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleStartEdit(member)}
                          className="hover:bg-secondary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteMember(member.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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