
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Mock user data - in a real app, this would come from the backend
  const [users, setUsers] = useState([
    {
      id: '1',
      fullName: 'Manager User',
      email: 'manager@example.com',
      role: 'manager',
      status: 'active',
      modules: {
        procurement: true,
        inventory: true,
        manufacturing: true,
        sales: true,
        financials: true
      }
    },
    {
      id: '2',
      fullName: 'Employee One',
      email: 'employee1@example.com',
      role: 'employee',
      status: 'active',
      modules: {
        procurement: true,
        inventory: true,
        manufacturing: false,
        sales: true,
        financials: false
      }
    },
    {
      id: '3',
      fullName: 'Employee Two',
      email: 'employee2@example.com',
      role: 'employee',
      status: 'inactive',
      modules: {
        procurement: false,
        inventory: true,
        manufacturing: false,
        sales: true,
        financials: false
      }
    }
  ]);
  
  const handleUserPermissions = (userId: string, module: string, value: boolean) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId 
        ? { ...user, modules: { ...user.modules, [module]: value } } 
        : user
    ));
    
    toast.success(`Updated ${module} access for user`);
  };
  
  const handleUserStatus = (userId: string, status: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, status } : user
    ));
    
    toast.success(`User status updated to ${status}`);
  };
  
  const handleSaveUser = (userData: any) => {
    if (editingUser) {
      // Update existing user
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === editingUser.id ? { ...user, ...userData } : user
      ));
      toast.success('User updated successfully');
    } else {
      // Add new user
      const newUser = {
        id: Math.random().toString(36).substring(7),
        ...userData,
        modules: {
          procurement: false,
          inventory: false,
          manufacturing: false,
          sales: false,
          financials: false
        }
      };
      setUsers(prev => [...prev, newUser]);
      toast.success('User added successfully');
    }
    
    setIsAddUserOpen(false);
    setEditingUser(null);
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast.success('User deleted successfully');
  };
  
  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage system users and permissions</p>
            </div>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage users and their access to system modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Module Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'manager' ? 'default' : 'outline'}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.status}
                          onValueChange={(value) => handleUserStatus(user.id, value)}
                          disabled={user.id === currentUser?.id} // Can't change own status
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <span className="flex items-center">
                                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                Active
                              </span>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <span className="flex items-center">
                                <span className="h-2 w-2 rounded-full bg-gray-300 mr-2"></span>
                                Inactive
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {user.role === 'employee' && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Configure Access
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Module Access for {user.fullName}</DialogTitle>
                                    <DialogDescription>
                                      Configure which modules this employee can access
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="grid gap-4 py-4">
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`procurement-${user.id}`} className="flex-1">Procurement</Label>
                                      <Switch 
                                        id={`procurement-${user.id}`}
                                        checked={user.modules.procurement}
                                        onCheckedChange={(checked) => handleUserPermissions(user.id, 'procurement', checked)}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`inventory-${user.id}`} className="flex-1">Inventory</Label>
                                      <Switch 
                                        id={`inventory-${user.id}`}
                                        checked={user.modules.inventory}
                                        onCheckedChange={(checked) => handleUserPermissions(user.id, 'inventory', checked)}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`sales-${user.id}`} className="flex-1">Sales</Label>
                                      <Switch 
                                        id={`sales-${user.id}`}
                                        checked={user.modules.sales}
                                        onCheckedChange={(checked) => handleUserPermissions(user.id, 'sales', checked)}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`manufacturing-${user.id}`} className="flex-1">Manufacturing</Label>
                                      <Switch 
                                        id={`manufacturing-${user.id}`}
                                        checked={user.modules.manufacturing}
                                        onCheckedChange={(checked) => handleUserPermissions(user.id, 'manufacturing', checked)}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`financials-${user.id}`} className="flex-1">Financials</Label>
                                      <Switch 
                                        id={`financials-${user.id}`}
                                        checked={user.modules.financials}
                                        onCheckedChange={(checked) => handleUserPermissions(user.id, 'financials', checked)}
                                      />
                                    </div>
                                  </div>
                                  
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => {}}>
                                      Done
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          
                          {user.role === 'manager' && (
                            <Badge variant="secondary">Full Access</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingUser(user);
                              setIsAddUserOpen(true);
                            }}
                            disabled={user.id === currentUser?.id} // Can't edit current user
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id} // Can't delete current user
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <UserFormDialog 
        open={isAddUserOpen} 
        onOpenChange={setIsAddUserOpen}
        user={editingUser}
        onSave={handleSaveUser}
      />
    </Layout>
  );
};

// User Form Dialog Component
interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSave: (userData: any) => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ 
  open, 
  onOpenChange,
  user,
  onSave 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'employee',
    status: 'active'
  });
  
  React.useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        role: 'employee',
        status: 'active'
      });
    }
  }, [user]);
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update user details and permissions' : 'Enter the details for the new user'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role}
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {user ? 'Update User' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementPage;
