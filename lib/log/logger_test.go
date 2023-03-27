// Copyright 2022 VMware, Inc.
// SPDX-License-Identifier: Apache-2.0
package log

import (
	"bytes"
	"os"
	"runtime"
	"strconv"
	"strings"
	"testing"
	"time"
)

var (
	message = "log message"
)

func initOutput() *bytes.Buffer {
	b := make([]byte, 0, 48)
	buffer := bytes.NewBuffer(b)
	logger.SetOutput(buffer)
	return buffer
}

func resetOutput() {
	logger.SetOutput(os.Stdout)
}

func TestLogger_Debug(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = DebugLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(DebugLevel)
	logger.Debug(message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Debugf(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = DebugLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(DebugLevel)
	logger.Debugf("%s", message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Info(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = InfoLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(InfoLevel)
	logger.Info(message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Infof(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = InfoLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(InfoLevel)
	logger.Infof("%s", message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Warning(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = WarningLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(WarningLevel)
	logger.Warning(message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Warningf(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = WarningLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(WarningLevel)
	logger.Warningf("%s", message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_output(t *testing.T) {
	entry := Entry{
		Time: time.Time{},
		Msg:  "",
		Line: "",
		L:    0,
	}
	logger.output(&entry)
}

func TestLogger_setLevel(t *testing.T) {
	logger.setLevel(WarningLevel)
}

func TestLogger_Error(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = ErrorLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(ErrorLevel)
	logger.Error(message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

func TestLogger_Errorf(t *testing.T) {
	buf := initOutput()
	defer resetOutput()

	var (
		expectedLevel = ErrorLevel.string()
		expectMsg     = "message"
	)

	logger.setLevel(ErrorLevel)
	logger.Errorf("%s", message)
	_, _, line, _ := runtime.Caller(0)
	expectLine := "logger_test.go:" + strconv.Itoa(line-1)

	str := buf.String()
	if !contains(t, str, expectedLevel, expectLine, expectMsg) {
		t.Errorf("unexpected message: %s, expected level: %s, expected line: %s, expected message: %s", str, expectedLevel, expectLine, expectMsg)
	}
}

// contains reports whether the string is contained in the log.
func contains(t *testing.T, str string, lvl string, line, msg string) bool {
	return strings.Contains(str, lvl) && strings.Contains(str, line) && strings.Contains(str, msg)
}
