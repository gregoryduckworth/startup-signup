import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WaitlistEntry {
  id: number;
  fullName: string;
  email: string;
  company: string | null;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  
  // Fetch waitlist entries
  const { data: entries, isLoading, isError } = useQuery<WaitlistEntry[]>({
    queryKey: ['/api/waitlist'],
  });

  // Delete waitlist entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/waitlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/waitlist'] });
      toast({
        title: "Entry deleted",
        description: "Waitlist entry has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="container py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Waitlist Admin Dashboard</CardTitle>
          <CardDescription>
            Manage all waitlist entries from this dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              Failed to load waitlist entries. Please try again later.
            </div>
          ) : entries && entries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.fullName}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell>{entry.company || "-"}</TableCell>
                    <TableCell>{formatDate(entry.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEntryMutation.mutate(entry.id)}
                        disabled={deleteEntryMutation.isPending}
                      >
                        {deleteEntryMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No waitlist entries found. When users sign up they will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}