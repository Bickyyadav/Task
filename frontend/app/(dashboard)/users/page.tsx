"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MoreVertical,
  Shield,
  User as UserIcon,
  Search,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { ApiResponse, PaginatedResponse, User, UserUpdate } from "@/types";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResponse<User>>>("/users", {
        params: { page: 1, limit: 100 },
      });
      return res.data.data;
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ uid, data }: { uid: string; data: UserUpdate }) => {
      await api.put(`/users/${uid}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const handleToggleStatus = (user: User) => {
    updateUser.mutate({
      uid: user.uid,
      data: { is_active: !user.is_active },
    });
  };

  const handleChangeRole = (user: User) => {
    updateUser.mutate({
      uid: user.uid,
      data: { role: user.role === "admin" ? "member" : "admin" },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage system users, roles, and access permissions.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by name or email..." className="pl-10" />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.items.map((user) => (
              <TableRow key={user.uid} className="group transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-bold text-xs">
                      {user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn(
                    "flex w-fit items-center gap-1 font-medium",
                    user.role === "admin" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : ""
                  )}>
                    {user.role === "admin" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <UserIcon className="h-3 w-3" />
                    )}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "flex w-fit items-center gap-1 font-medium",
                    user.is_active 
                      ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30" 
                      : "text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/30"
                  )}>
                    {user.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleChangeRole(user)}>
                        Change to {user.role === "admin" ? "Member" : "Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(user)}
                        className={user.is_active ? "text-destructive focus:text-destructive" : "text-emerald-600 focus:text-emerald-600"}
                      >
                        {user.is_active ? "Deactivate User" : "Activate User"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
