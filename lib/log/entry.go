// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

import "time"

type Entry struct {
	Time time.Time // time of the log produced
	Msg  string    // content of the entry
	Line string    // in which file and line that the log has been produced
	L    Level     // level of the log
}

// NewEntry creates an entry of journal with the args
func NewEntry(time time.Time, msg, line string, l Level) *Entry {
	return &Entry{
		Time: time,
		Msg:  msg,
		Line: line,
		L:    l,
	}
}
