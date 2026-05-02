"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Search, Loader2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddMember, useRemoveMember, useAllUsers } from "@/hooks/useProjects";
import { getInitials } from "@/lib/utils";
import type { User, ProjectDetail } from "@/types";

interface MemberManagerProps {
  project: ProjectDetail;
  isAdmin: boolean;
}

export function MemberManager({ project, isAdmin }: MemberManagerProps) {
  const [search, setSearch] = useState("");
  const { data: allUsers, isLoading: isLoadingUsers } = useAllUsers();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const filteredAvailableUsers = allUsers?.filter(
    (u) =>
      !project.member_ids.includes(u.uid) &&
      (u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddMember = (userId: string) => {
    console.log("Adding member:", userId, "to project:", project.uid);
    addMember.mutate({ projectId: project.uid, userId });
  };

  const handleRemoveMember = (userId: string) => {
    removeMember.mutate({ projectId: project.uid, userId });
  };

  return (
    <Card className="border border-border/50 shadow-md">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Team Members</CardTitle>
            <CardDescription>
              {project.member_ids.length} people working on this project
            </CardDescription>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" className="bg-violet-600 hover:bg-violet-700" />}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 h-8 text-xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-64">
                  {isLoadingUsers ? (
                    <div className="p-4 flex justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredAvailableUsers && filteredAvailableUsers.length > 0 ? (
                    <div className="p-1">
                      <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                        {filteredAvailableUsers.length} Candidates Found
                      </div>
                      {filteredAvailableUsers.map((user) => (
                        <DropdownMenuItem
                          key={user.uid}
                          className="flex items-center gap-3 p-2 cursor-pointer"
                          onSelect={() => handleAddMember(user.uid)}
                          onClick={() => handleAddMember(user.uid)}
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700 font-bold">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate">
                              {user.full_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No users found
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {project.members?.map((member) => (
            <div key={member.uid} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-violet-500 text-white font-bold text-sm">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{member.full_name}</span>
                    {member.uid === project.owner_id && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold tracking-wider">
                        Owner
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
              </div>
              
              {isAdmin && member.uid !== project.owner_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => handleRemoveMember(member.uid)}
                  disabled={removeMember.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
