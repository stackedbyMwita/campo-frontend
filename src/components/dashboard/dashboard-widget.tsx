"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, LucideIcon, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Define the shape of a column
export interface Column<T> {
  header: string;
  accessorKey?: keyof T; // If just displaying text
  cell?: (item: T) => React.ReactNode; // If custom rendering (badges, icons) is needed
  className?: string; // For alignment (text-right, w-[100px])
}

interface DashboardWidgetProps<T> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  viewAllLink?: string;
  
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

export function DashboardWidget<T extends { _id: string | number }>({
  title,
  description,
  icon: Icon,
  viewAllLink,
  data,
  columns,
  isLoading
}: DashboardWidgetProps<T>) {

  return (
    <Card className="xl:col-span-2 shadow-sm border-none bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        
        {/* 'View All' Button (Optional) */}
        {viewAllLink && (
          <Button asChild size="sm" variant="ghost" className="ml-auto gap-1 text-xs">
            <Link href={viewAllLink}>
              View All <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
             <Skeleton className="h-8 w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-37.5 items-center justify-center text-sm text-muted-foreground border-dashed border rounded-md">
            No recent activity found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableHead key={idx} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item._id}>
                  {columns.map((col, idx) => (
                    <TableCell key={idx} className={col.className}>
                      {col.cell 
                        ? col.cell(item) 
                        : (item[col.accessorKey as keyof T] as React.ReactNode)
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
